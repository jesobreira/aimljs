import type { SessionData, ConversationTurn, TripleEntry } from '../types';
import { generateId } from '../utils/uid';

/**
 * Represents a single user's conversation state.
 *
 * A `Session` stores everything that makes one user's conversation distinct:
 * named predicates (variables), conversation history, the current topic,
 * and — for AIML 2.0 — a triple store for subject/predicate/object facts.
 *
 * Sessions are created automatically by {@link AIMLBot.talk} when no
 * `sessionId` is supplied, or explicitly via {@link AIMLBot.createSession}.
 * They can be serialised to JSON and restored later to resume a conversation.
 *
 * @example
 * ```ts
 * const bot = new AIML1Bot();
 * await bot.loadFile('alice.aiml');
 *
 * // Start a named session
 * const session = bot.createSession('user-42');
 * session.setPredicate('name', 'Alice');
 *
 * const { response } = await bot.talkSession('hello', session);
 *
 * // Serialise and restore later
 * const saved = session.toJSON();
 * const restored = Session.fromJSON(saved);
 * ```
 *
 * @category Core
 */
export class Session {
  /** Unique session identifier. */
  readonly id: string;
  private predicates: Map<string, string> = new Map();
  private history: ConversationTurn[] = [];
  private topic: string = 'default';
  private tripleStore: TripleEntry[] = [];
  /** Unix timestamp (ms) when the session was created. */
  readonly created: number;
  private updated: number;

  /** @param id Optional explicit session ID; a unique ID is generated if omitted. */
  constructor(id?: string) {
    this.id = id ?? generateId('session');
    this.created = Date.now();
    this.updated = this.created;
  }

  // ─── Predicates ─────────────────────────────────────────────────────────────

  /**
   * Read a named predicate value.
   *
   * Predicate names are case-insensitive.  Returns `""` if the predicate
   * has not been set (matching AIML semantics for `<get name="..."/>`).
   *
   * @param name Predicate name (case-insensitive).
   */
  getPredicate(name: string): string {
    // Unset predicates return "unknown" per Pandorabots/AIML 2.0 convention.
    // This is consistent with AIML 1.0 ALICE bots too (both use "unknown" as sentinel).
    return this.predicates.get(name.toLowerCase()) ?? 'unknown';
  }

  /**
   * Set a named predicate.
   *
   * This is called automatically by `<set name="...">` template tags.
   * Setting `"topic"` also updates the session topic.
   *
   * @param name  Predicate name.
   * @param value New value.
   */
  setPredicate(name: string, value: string): void {
    this.predicates.set(name.toLowerCase(), value);
    this.updated = Date.now();
  }

  /**
   * Delete a named predicate.
   * @param name Predicate name.
   */
  deletePredicate(name: string): void {
    this.predicates.delete(name.toLowerCase());
  }

  /**
   * Return all predicates as a plain object snapshot.
   * Useful for debugging or serialisation.
   */
  getAllPredicates(): Record<string, string> {
    return Object.fromEntries(this.predicates);
  }

  // ─── Topic ──────────────────────────────────────────────────────────────────

  /**
   * Return the current conversation topic.
   * @default "default"
   */
  getTopic(): string {
    return this.topic || 'default';
  }

  /**
   * Set the current conversation topic.
   * Also updates the `"topic"` predicate so `<get name="topic"/>` works.
   */
  setTopic(topic: string): void {
    this.topic = topic;
    this.predicates.set('topic', topic);
    this.updated = Date.now();
  }

  // ─── History ────────────────────────────────────────────────────────────────

  /**
   * Append a completed conversation turn to the history.
   * Called automatically after each {@link AIMLBot.talk} call.
   */
  addTurn(input: string, response: string): void {
    this.history.push({
      input,
      response,
      timestamp: Date.now(),
      topic: this.topic,
    });
    this.updated = Date.now();
  }

  /**
   * Return the Nth previous user input (1-based, 1 = most recent).
   *
   * Used by the `<input index="N"/>` template tag.
   *
   * @param index 1-based index into history (1 = last input).
   */
  getInput(index: number = 1): string {
    const turn = this.history[this.history.length - index];
    return turn?.input ?? '';
  }

  /**
   * Return the Nth previous bot response (1-based, 1 = most recent).
   *
   * Used by the `<response index="N"/>` template tag (AIML 2.0).
   *
   * @param index 1-based index (1 = last response).
   */
  getResponse(index: number = 1): string {
    const turn = this.history[this.history.length - index];
    return turn?.response ?? '';
  }

  /**
   * Return the Mth sentence of the Nth previous bot response.
   *
   * Used by `<that index="N,M"/>`.  Sentences are split on `.`, `!`, `?`.
   *
   * @param responseIndex Response index (1 = most recent).
   * @param sentenceIndex Sentence index within that response (1 = first).
   */
  getThat(responseIndex: number = 1, sentenceIndex: number = 1): string {
    const resp = this.getResponse(responseIndex);
    if (!resp) return '';
    const sentences = resp.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    return sentences[sentenceIndex - 1] ?? sentences[sentences.length - 1] ?? resp;
  }

  /** Return a copy of the full conversation history. */
  getHistory(): ConversationTurn[] {
    return [...this.history];
  }

  /** Clear all conversation history. */
  clearHistory(): void {
    this.history = [];
  }

  // ─── Triple Store (AIML 2.0) ─────────────────────────────────────────────────

  /**
   * Add a subject/predicate/object triple.
   *
   * Called by `<addtriple>` template tags.  Keys are lower-cased;
   * duplicate triples are silently ignored.
   *
   * @example
   * session.addTriple('alice', 'likes', 'cats');
   * session.queryTriples('alice', 'likes'); // → [{ subject:'alice', predicate:'likes', object:'cats' }]
   */
  addTriple(subject: string, predicate: string, object: string): void {
    const s = subject.toLowerCase();
    const p = predicate.toLowerCase();
    const o = object.toLowerCase();
    const exists = this.tripleStore.some(
      t => t.subject === s && t.predicate === p && t.object === o,
    );
    if (!exists) {
      this.tripleStore.push({ subject: s, predicate: p, object: o });
    }
  }

  /**
   * Delete a specific triple.  Called by `<deletetriple>`.
   */
  deleteTriple(subject: string, predicate: string, object: string): void {
    const s = subject.toLowerCase();
    const p = predicate.toLowerCase();
    const o = object.toLowerCase();
    this.tripleStore = this.tripleStore.filter(
      t => !(t.subject === s && t.predicate === p && t.object === o),
    );
  }

  /**
   * Query the triple store.  Pass `undefined` to a field to act as a wildcard.
   *
   * @param subject   Filter by subject (optional).
   * @param predicate Filter by predicate (optional).
   * @param object    Filter by object (optional).
   * @returns Matching triples.
   */
  queryTriples(
    subject?: string,
    predicate?: string,
    object?: string,
  ): TripleEntry[] {
    return this.tripleStore.filter(t => {
      if (subject && t.subject !== subject.toLowerCase()) return false;
      if (predicate && t.predicate !== predicate.toLowerCase()) return false;
      if (object && t.object !== object.toLowerCase()) return false;
      return true;
    });
  }

  // ─── Serialisation ───────────────────────────────────────────────────────────

  /**
   * Serialise the session to a plain {@link SessionData} object.
   *
   * Pass the result to `JSON.stringify()` and store it.
   * Restore with {@link Session.deserialize}.
   */
  serialize(): SessionData {
    return {
      id: this.id,
      predicates: this.getAllPredicates(),
      history: [...this.history],
      topic: this.topic,
      created: this.created,
      updated: this.updated,
      tripleStore: [...this.tripleStore],
    };
  }

  /**
   * Restore a session from a {@link SessionData} object.
   *
   * @example
   * const saved = session.serialize();
   * // … store saved somewhere …
   * const session2 = Session.deserialize(saved);
   */
  static deserialize(data: SessionData): Session {
    const session = new Session(data.id);
    for (const [k, v] of Object.entries(data.predicates)) {
      session.predicates.set(k, v);
    }
    session.history = data.history ?? [];
    session.topic = data.topic ?? 'default';
    (session as any).updated = data.updated;
    (session as any).created = data.created;
    if (data.tripleStore) session.tripleStore = [...data.tripleStore];
    return session;
  }

  /**
   * Serialise the session to a JSON string.
   *
   * Use {@link Session.fromJSON} to restore.
   *
   * @example
   * localStorage.setItem('session', session.toJSON());
   */
  toJSON(): string {
    return JSON.stringify(this.serialize());
  }

  /**
   * Restore a session from a JSON string produced by {@link Session.toJSON}.
   *
   * @example
   * const session = Session.fromJSON(localStorage.getItem('session')!);
   */
  static fromJSON(json: string): Session {
    return Session.deserialize(JSON.parse(json));
  }
}
