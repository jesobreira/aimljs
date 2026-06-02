/**
 * @module AIMLBot
 * @category Bots
 */
import { PatternMatcher } from '../core/PatternMatcher';
import { TemplateProcessor } from '../core/TemplateProcessor';
import { Normalizer, buildSubstitutionPair } from '../core/Normalizer';
import { Session } from '../core/Session';
import { parseAIML } from '../parsers/AIMLParser';
import {
  parseProperties,
  parseSubstitutions,
  parseSet,
  parseMap,
} from '../parsers/DataParser';
import { loadFileSource, loadDirectory } from '../loaders/FileLoader';
import type {
  BotOptions,
  TalkResult,
  FileSource,
  SessionData,
  ValidationResult,
  AIMLSet,
  AIMLMap,
  SubstitutionPair,
  InterpreterContext,
} from '../types';
import { validateAIML } from '../parsers/AIMLParser';

/**
 * Constructor options for {@link AIMLBot} and its subclasses.
 *
 * Extends {@link BotOptions} with runtime-only settings.
 */
export interface AIMLBotOptions extends BotOptions {
  /**
   * AIML dialect version to use when auto-detection fails.
   * @default '1.0'
   */
  aimlVersion?: '1.0' | '2.0';
  /**
   * Allow `<system>` tags to execute shell commands (Node.js only).
   * Disabled by default for security.
   * @default false
   */
  enableSystem?: boolean;
  /**
   * Allow `<javascript>` tags to execute arbitrary JS via `new Function`.
   * @default false (tag silently ignored when disabled)
   */
  enableJavaScript?: boolean;
}

/**
 * Base class for all AIML bots.
 *
 * `AIMLBot` provides the complete bot runtime: pattern matching, template
 * evaluation, session management, file loading, and serialisation.  The
 * two specialised subclasses ({@link AIML1Bot} and {@link AIML2Bot}) add
 * version-specific helpers but share this API.
 *
 * ---
 *
 * ### Quick-start (Node.js)
 *
 * ```ts
 * import { AIML1Bot } from 'aimljs';
 *
 * const bot = new AIML1Bot({ properties: { name: 'Alice' } });
 * await bot.loadDirectory('./aiml');          // load all .aiml files
 *
 * const { response } = await bot.talk('hello');
 * console.log(response); // "Hi there!"
 * ```
 *
 * ### Quick-start (browser)
 *
 * ```ts
 * import { AIML1Bot } from 'aimljs';
 *
 * const bot = new AIML1Bot();
 * // Pass File objects from <input type="file"> or pre-loaded content:
 * await bot.loadFile({ name: 'greetings.aiml', content: xmlString });
 *
 * const { response, sessionId } = await bot.talk('hello');
 * ```
 *
 * ### Session continuity
 *
 * ```ts
 * // First turn — a default session is created automatically
 * const r1 = await bot.talk('my name is Alice');
 *
 * // Pass the sessionId back to continue the same conversation
 * const r2 = await bot.talk('what is my name', r1.sessionId);
 * console.log(r2.response); // "Your name is Alice."
 * ```
 *
 * @category Bots
 */
export class AIMLBot {
  /** @internal */
  protected readonly aimlVersion: '1.0' | '2.0';
  /** @internal */
  protected matcher: PatternMatcher;
  /** @internal */
  protected processor: TemplateProcessor;
  /** @internal */
  protected normalizer: Normalizer;
  /** @internal */
  protected sessions: Map<string, Session> = new Map();
  /** @internal */
  protected botProperties: Record<string, string>;
  /** @internal */
  protected sets: Map<string, AIMLSet> = new Map();
  /** @internal */
  protected maps: Map<string, AIMLMap> = new Map();
  /** @internal */
  protected maxRecursionDepth: number;
  /** @internal */
  protected maxLoopIterations: number;
  /** @internal */
  protected defaultTopic: string;
  /** @internal */
  protected options: AIMLBotOptions;

  constructor(options: AIMLBotOptions = {}) {
    this.options = options;
    this.aimlVersion = options.aimlVersion ?? '1.0';
    this.maxRecursionDepth = options.maxRecursionDepth ?? 50;
    this.maxLoopIterations = options.maxLoopIterations ?? 1000;
    this.defaultTopic = options.defaultTopic ?? 'default';

    this.botProperties = {
      name: 'AIMLBot',
      version: '1.0',
      species: 'robot',
      genus: 'bot',
      ...options.properties,
    };

    this.normalizer = new Normalizer(options.substitutions);

    if (options.sets) {
      for (const [name, data] of Object.entries(options.sets)) {
        this.sets.set(name.toLowerCase(), parseSet(data instanceof Set ? [...data] : data));
      }
    }
    if (options.maps) {
      for (const [name, data] of Object.entries(options.maps)) {
        this.maps.set(name.toLowerCase(), parseMap(data instanceof Map ? Object.fromEntries(data) : data));
      }
    }

    this.matcher = new PatternMatcher();
    this.matcher.setBotProperties(this.botProperties);
    this.syncSetsToMatcher();

    this.processor = new TemplateProcessor({
      normalizer: this.normalizer,
      matcher: this.matcher,
      botProperties: this.botProperties,
      maps: this.maps,
      maxRecursionDepth: this.maxRecursionDepth,
      maxLoopIterations: this.maxLoopIterations,
      system: options.enableSystem ? this.executeSystem.bind(this) : undefined,
      learnf: this.handleLearnf.bind(this),
      onGossip: this.handleGossip.bind(this),
    });

    (this.processor as any)._onLearn = (xml: string) => {
      this.loadXMLString(xml).catch(() => {});
    };
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  /**
   * Parse and load an AIML XML string directly.
   *
   * @param xml      AIML XML content.
   * @param fileName Optional name shown in validation error messages.
   * @throws If the XML contains parse errors.
   *
   * @example
   * ```ts
   * await bot.loadXMLString(`
   *   <aiml version="1.0">
   *     <category>
   *       <pattern>HELLO</pattern>
   *       <template>Hi!</template>
   *     </category>
   *   </aiml>
   * `);
   * ```
   */
  async loadXMLString(xml: string, fileName?: string): Promise<void> {
    const { categories, errors } = parseAIML(xml, fileName, this.aimlVersion);
    if (errors.length > 0) {
      const msg = errors.map(e => e.message).join('; ');
      throw new Error(`AIML parse errors: ${msg}`);
    }
    this.matcher.addCategories(categories);
  }

  /**
   * Load a single AIML file from any {@link FileSource}.
   *
   * Works on both Node.js (string path) and in the browser (File object or
   * pre-loaded `{ name, content }` object).
   *
   * @param source The file to load.
   *
   * @example
   * ```ts
   * // Node.js
   * await bot.loadFile('/path/to/greetings.aiml');
   *
   * // Browser (from <input type="file">)
   * const [file] = inputElement.files;
   * await bot.loadFile(file);
   *
   * // Pre-loaded content (both platforms)
   * await bot.loadFile({ name: 'greeting.aiml', content: xmlString });
   * ```
   */
  async loadFile(source: FileSource): Promise<void> {
    const { name, content } = await loadFileSource(source);
    await this.loadXMLString(content, name);
  }

  /**
   * Load multiple AIML files concurrently.
   *
   * @param sources Array of {@link FileSource} values.
   *
   * @example
   * ```ts
   * await bot.loadFiles([
   *   '/path/to/greetings.aiml',
   *   '/path/to/personality.aiml',
   *   { name: 'custom.aiml', content: inlineXml },
   * ]);
   * ```
   */
  async loadFiles(sources: FileSource[]): Promise<void> {
    await Promise.all(sources.map(s => this.loadFile(s)));
  }

  /**
   * Recursively load all `.aiml` files from a directory.
   *
   * **Node.js only.** Throws in browser environments.
   *
   * @param dirPath    Absolute or relative path to the directory.
   * @param recursive  Whether to descend into subdirectories. Default `true`.
   * @param extensions File extensions to include. Default `['.aiml']`.
   *
   * @example
   * ```ts
   * await bot.loadDirectory('./knowledge-base');
   * await bot.loadDirectory('./kb', true, ['.aiml', '.xml']);
   * ```
   */
  async loadDirectory(
    dirPath: string,
    recursive = true,
    extensions: string[] = ['.aiml'],
  ): Promise<void> {
    if (typeof process === 'undefined') {
      throw new Error('loadDirectory is only available in Node.js environments');
    }
    const files = await loadDirectory(dirPath, extensions, recursive);
    for (const { name, content } of files) {
      await this.loadXMLString(content, name);
    }
  }

  // ─── Properties ───────────────────────────────────────────────────────────

  /**
   * Set a single bot property.
   *
   * Bot properties are accessed in AIML templates via `<bot name="..."/>`.
   *
   * @param name  Property name (case-insensitive).
   * @param value Property value.
   *
   * @example
   * bot.setProperty('name', 'Alice');
   * // In AIML: <bot name="name"/> → "Alice"
   */
  setProperty(name: string, value: string): void {
    this.botProperties[name.toLowerCase()] = value;
    this.matcher.setBotProperties(this.botProperties);
    (this.processor as any).deps.botProperties = this.botProperties;
  }

  /**
   * Get a bot property value.
   *
   * @param name Property name (case-insensitive).
   * @returns The property value, or `""` if not set.
   */
  getProperty(name: string): string {
    return this.botProperties[name.toLowerCase()] ?? '';
  }

  /**
   * Load bot properties from a text or JSON data source.
   *
   * Accepts the same formats as {@link parseProperties}:
   * - Plain object
   * - JSON string (`{ "key": "value" }`)
   * - Text file (`key:value` or `key=value`, one per line)
   *
   * @example
   * bot.loadProperties('name:Alice\nversion:2.0');
   * bot.loadProperties({ name: 'Alice', version: '2.0' });
   * bot.loadProperties('{"name":"Alice"}');
   */
  loadProperties(data: string | Record<string, string>): void {
    const props = parseProperties(data);
    for (const [k, v] of Object.entries(props)) {
      this.botProperties[k] = v;
    }
    this.matcher.setBotProperties(this.botProperties);
    (this.processor as any).deps.botProperties = this.botProperties;
  }

  // ─── Substitutions ────────────────────────────────────────────────────────

  /**
   * Replace a substitution table entirely.
   *
   * @param type Which table to replace (`'normal'`, `'person'`, etc.).
   * @param data Text, JSON, or already-parsed pairs.
   *
   * @example
   * // Load contractions from text
   * bot.loadSubstitutions('normal', "can't : cannot\nwon't : will not");
   * // Load from JSON array
   * bot.loadSubstitutions('person', '[{"find":"I","replace":"he or she"}]');
   */
  loadSubstitutions(
    type: 'normal' | 'person' | 'person2' | 'gender' | 'denormal',
    data: string | SubstitutionPair[],
  ): void {
    const pairs = parseSubstitutions(data);
    this.normalizer.updateSubstitutions(type, pairs);
  }

  /**
   * Append a single substitution rule to a table.
   *
   * @param type    Which table to extend.
   * @param find    The text to find.
   * @param replace The replacement.
   *
   * @example
   * bot.addSubstitution('normal', "ain't", 'am not');
   */
  addSubstitution(
    type: 'normal' | 'person' | 'person2' | 'gender' | 'denormal',
    find: string,
    replace: string,
  ): void {
    this.normalizer.addSubstitutions(type, [buildSubstitutionPair(find, replace)]);
  }

  // ─── Sets & Maps ──────────────────────────────────────────────────────────

  /**
   * Register a named set for use in pattern matching.
   *
   * Sets enable patterns like `I LIKE <set>color</set>` to match any member
   * of the named set.
   *
   * @param name Set name (case-insensitive).
   * @param data Set content: string array, `Set<string>`, JSON array, or one-per-line text.
   *
   * @example
   * bot.loadSet('color', ['red', 'green', 'blue']);
   * bot.loadSet('animal', 'cat\ndog\nbird');
   * bot.loadSet('fruit', '["apple","banana","cherry"]');
   */
  loadSet(name: string, data: string | string[] | Set<string>): void {
    const set = parseSet(Array.isArray(data) ? data : data instanceof Set ? [...data] : data);
    this.sets.set(name.toLowerCase(), set);
    this.syncSetsToMatcher();
  }

  /**
   * Register a named map for use in `<map name="...">` template tags.
   *
   * @param name Map name (case-insensitive).
   * @param data Map content: plain object, `Map<string, string>`, JSON object, or `key:value` text.
   *
   * @example
   * bot.loadMap('capitals', { france: 'Paris', japan: 'Tokyo' });
   * bot.loadMap('colors', 'red : #FF0000\ngreen : #00FF00');
   * bot.loadMap('scores', '{"alice":"100","bob":"200"}');
   */
  loadMap(name: string, data: string | Record<string, string> | Map<string, string>): void {
    const map = parseMap(data instanceof Map ? Object.fromEntries(data) : data);
    this.maps.set(name.toLowerCase(), map);
    (this.processor as any).deps.maps = this.maps;
  }

  private syncSetsToMatcher(): void {
    for (const [name, set] of this.sets) {
      this.matcher.setSet(name, set);
    }
  }

  // ─── Category management ──────────────────────────────────────────────────

  /**
   * Programmatically add a single AIML category.
   *
   * The pattern and template strings use AIML XML syntax (tags are allowed).
   *
   * @param pattern  AIML input pattern.
   * @param template AIML response template.
   * @param options  Optional `that` and `topic` constraints.
   *
   * @example
   * bot.addCategory('HELLO', 'Hi there!');
   * bot.addCategory('DO YOU LIKE *', 'I love <star/>!', { topic: 'ANIMALS' });
   */
  addCategory(pattern: string, template: string, options: {
    that?: string;
    topic?: string;
  } = {}): void {
    const thatPart = options.that ? `<that>${options.that}</that>` : '';
    const topicEl = options.topic
      ? `<topic name="${options.topic}"><category><pattern>${pattern}</pattern>${thatPart}<template>${template}</template></category></topic>`
      : `<category><pattern>${pattern}</pattern>${thatPart}<template>${template}</template></category>`;
    const xml = `<aiml version="${this.aimlVersion}">${topicEl}</aiml>`;
    this.loadXMLString(xml).catch(() => {});
  }

  /** Total number of loaded categories. */
  get categoryCount(): number {
    return this.matcher.size;
  }

  // ─── Sessions ─────────────────────────────────────────────────────────────

  /**
   * Create a new session.
   *
   * Sessions are created automatically by {@link talk}, so you only need this
   * if you want to pre-configure a session (set predicates, topic, etc.).
   *
   * @param sessionId Optional explicit ID.  A unique ID is generated if omitted.
   * @returns The new session.
   *
   * @example
   * const session = bot.createSession('user-42');
   * session.setPredicate('name', 'Alice');
   * const { response } = await bot.talkSession('hello', session);
   */
  createSession(sessionId?: string): Session {
    const session = new Session(sessionId);
    session.setTopic(this.defaultTopic);
    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Retrieve an existing session by ID.
   *
   * @param sessionId The session ID to look up.
   * @returns The session, or `undefined` if not found.
   */
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get an existing session or create one if it does not exist.
   *
   * When `sessionId` is omitted a persistent default session (`__default__`)
   * is used for all calls without an ID.
   *
   * @param sessionId Optional session ID.
   */
  getOrCreateSession(sessionId?: string): Session {
    const key = sessionId ?? '__default__';
    const existing = this.sessions.get(key);
    if (existing) return existing;
    return this.createSession(key);
  }

  /**
   * Delete a session and free its memory.
   *
   * @param sessionId Session to delete.
   * @returns `true` if the session existed and was deleted.
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  // ─── Conversation ─────────────────────────────────────────────────────────

  /**
   * Send a message to the bot and get a response.
   *
   * If `sessionId` is omitted, a shared default session (`__default__`) is used
   * so that consecutive calls without a session ID maintain conversational state.
   *
   * @param input     The user's message.
   * @param sessionId Optional session ID.  Pass the `sessionId` from a previous
   *                  result to continue that conversation.
   * @returns An object with the bot's `response` and the `sessionId` used.
   *
   * @example
   * ```ts
   * const r1 = await bot.talk('my name is Alice');
   * // r1.sessionId is '__default__' (or whatever was used)
   *
   * const r2 = await bot.talk('what is my name', r1.sessionId);
   * console.log(r2.response); // "Your name is Alice."
   *
   * // Multi-user: pass explicit session IDs
   * await bot.talk('hello', 'user-1');
   * await bot.talk('hello', 'user-2');
   * ```
   */
  async talk(input: string, sessionId?: string): Promise<TalkResult> {
    const session = this.getOrCreateSession(sessionId);
    const response = await this.processInput(input, session);
    return { response, sessionId: session.id };
  }

  /**
   * Send a message using an explicit {@link Session} object.
   *
   * Useful when you manage sessions yourself rather than by ID.
   *
   * @param input   The user's message.
   * @param session The session to use.
   * @returns The bot's response string.
   */
  async talkSession(input: string, session: Session): Promise<string> {
    return this.processInput(input, session);
  }

  /** @internal */
  protected async processInput(rawInput: string, session: Session): Promise<string> {
    const normalized = this.normalizer.normalize(rawInput);
    if (!normalized) return '';

    const that = session.getThat() || '*';
    const topic = session.getTopic() || this.defaultTopic;

    const matchResult = this.matcher.match(normalized, that, topic);
    if (!matchResult) {
      const response = await this.handleNoMatch(normalized, session);
      session.addTurn(rawInput, response);
      return response;
    }

    const ctx: InterpreterContext = {
      session,
      matchResult,
      recursionDepth: 0,
      loopCount: 0,
      input: normalized,
      localVars: new Map(),
    };

    const response = (await this.processor.process(matchResult.category.template, ctx)).trim();
    session.addTurn(rawInput, response);
    return response;
  }

  /**
   * Called when no category matches the user's input.
   *
   * Override in a subclass to provide a custom fallback response.
   * The default implementation returns `""`.
   */
  protected async handleNoMatch(_input: string, _session: Session): Promise<string> {
    return '';
  }

  // ─── Validation ───────────────────────────────────────────────────────────

  /**
   * Validate an AIML XML string without loading it.
   *
   * Returns a {@link ValidationResult} with `valid`, `errors`, and `warnings`.
   *
   * @example
   * ```ts
   * const result = bot.validateXML(xmlString, 'mybot.aiml');
   * if (!result.valid) {
   *   result.errors.forEach(e => console.error(e.message));
   * }
   * ```
   */
  validateXML(xml: string, fileName?: string): ValidationResult {
    return validateAIML(xml, fileName);
  }

  // ─── Serialisation ────────────────────────────────────────────────────────

  /**
   * Serialise a single session to a JSON string.
   *
   * Store the result and pass it to {@link loadSerializedSession} later to
   * resume the conversation.
   *
   * @param sessionId The session to serialise.
   * @throws If the session does not exist.
   *
   * @example
   * ```ts
   * const json = bot.serializeSession(sessionId);
   * localStorage.setItem('mySession', json);
   *
   * // Later…
   * const saved = localStorage.getItem('mySession')!;
   * const id = bot.loadSerializedSession(saved);
   * const { response } = await bot.talk('hello again', id);
   * ```
   */
  serializeSession(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);
    return session.toJSON();
  }

  /**
   * Restore a session from a JSON string produced by {@link serializeSession}.
   *
   * @param data Serialised session JSON.
   * @returns The restored session's ID.
   */
  loadSerializedSession(data: string): string {
    const session = Session.fromJSON(data);
    this.sessions.set(session.id, session);
    return session.id;
  }

  /**
   * Serialise **all** active sessions to a single JSON string.
   *
   * Useful for persisting a multi-user application's full state.
   * Restore with {@link loadAllSerializedSessions}.
   */
  serializeAllSessions(): string {
    const sessions: SessionData[] = [];
    for (const session of this.sessions.values()) {
      sessions.push(session.serialize());
    }
    return JSON.stringify(sessions);
  }

  /**
   * Restore all sessions from a JSON string produced by {@link serializeAllSessions}.
   *
   * @param data  Serialised sessions JSON.
   * @returns     Array of restored session IDs.
   */
  loadAllSerializedSessions(data: string): string[] {
    const sessions: SessionData[] = JSON.parse(data);
    const ids: string[] = [];
    for (const sessionData of sessions) {
      const session = Session.deserialize(sessionData);
      this.sessions.set(session.id, session);
      ids.push(session.id);
    }
    return ids;
  }

  // ─── Internal handlers ────────────────────────────────────────────────────

  private async executeSystem(cmd: string): Promise<string> {
    if (!this.options.enableSystem) return '';
    try {
      const { exec } = await import('child_process');
      return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout) => {
          if (err) reject(err);
          else resolve(stdout.trim());
        });
      });
    } catch {
      return '';
    }
  }

  private async handleLearnf(xml: string): Promise<void> {
    await this.loadXMLString(xml, 'learnf.aiml');
  }

  /**
   * Called whenever a `<gossip>` tag is encountered.
   * Override to log or store gossip messages.
   */
  protected handleGossip(_text: string): void {
    // no-op by default
  }
}
