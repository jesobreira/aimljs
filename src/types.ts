/**
 * @module types
 * @categoryDescription Types
 * Shared type definitions used throughout the library.
 */

// ─── Pattern & Category ───────────────────────────────────────────────────────

/** A wildcard character supported in AIML patterns. */
export type WildcardChar = '#' | '_' | '^' | '*';

/**
 * A single token in a parsed AIML pattern.
 *
 * Patterns are split into tokens that are either exact words, wildcards,
 * set references, or bot-property references.
 *
 * @example
 * // Pattern "HELLO *" produces two tokens:
 * // { type: 'exact', word: 'HELLO' }
 * // { type: 'wildcard', char: '*' }
 */
export type PatternToken =
  | { type: 'exact'; word: string }
  | { type: 'wildcard'; char: WildcardChar }
  | { type: 'set'; name: string }
  | { type: 'bot'; name: string };

/** A pattern after it has been tokenized, with the original raw string preserved. */
export interface ParsedPattern {
  tokens: PatternToken[];
  raw: string;
}

/**
 * A single AIML category: the fundamental unit of an AIML knowledge base.
 *
 * A category is a triple of (pattern, that, topic) → template.
 * The bot matches the user's input against `pattern`, the last bot response
 * against `that`, and the current conversation topic against `topic`.
 */
export interface Category {
  /** Unique identifier generated at parse time. */
  id: string;
  /** The input pattern to match. */
  pattern: ParsedPattern;
  /** The `<that>` context pattern (defaults to `*`). */
  that: ParsedPattern;
  /** The `<topic>` pattern (defaults to `*`). */
  topic: ParsedPattern;
  /** The parsed XML template node. */
  template: Node;
  /** Source file name (if loaded from a file). */
  file?: string;
  /** AIML version this category was parsed under. */
  aimlVersion: '1.0' | '2.0';
}

// ─── Substitutions / Properties ──────────────────────────────────────────────

/**
 * A compiled substitution rule.  The `find` regex is used to locate
 * occurrences in input text and `replace` is the replacement string.
 */
export interface SubstitutionPair {
  find: RegExp;
  replace: string;
}

/**
 * The full set of substitution tables used by the normalizer.
 *
 * | Table      | Purpose |
 * |------------|---------|
 * | `normal`   | Input normalisation (contractions, punctuation, etc.) |
 * | `person`   | First ↔ third person pronoun swap |
 * | `person2`  | First ↔ second person pronoun swap |
 * | `gender`   | Gender pronoun swap (he ↔ she, him ↔ her, …) |
 * | `denormal` | Reverse of `normal`, applied to bot output |
 */
export interface Substitutions {
  normal: SubstitutionPair[];
  person: SubstitutionPair[];
  person2: SubstitutionPair[];
  gender: SubstitutionPair[];
  denormal: SubstitutionPair[];
}

/** A flat key/value map of bot properties. Keys are always lower-cased internally. */
export interface BotProperties {
  [key: string]: string;
}

// ─── Maps & Sets ─────────────────────────────────────────────────────────────

/**
 * A named set of strings used in AIML pattern matching.
 *
 * Sets can be used in patterns like `<set>color</set>` (AIML 1.0) or
 * `<set name="color"/>` (AIML 2.0) to match any member of the set.
 *
 * @example
 * bot.loadSet('color', ['red', 'green', 'blue']);
 * // Pattern: "MY FAVORITE COLOR IS <set>color</set>"
 */
export type AIMLSet = Set<string>;

/**
 * A named map of key→value strings used with the `<map>` template tag.
 *
 * @example
 * bot.loadMap('capitals', { france: 'Paris', japan: 'Tokyo' });
 * // Template: "The capital is <map name="capitals"><star/></map>"
 */
export type AIMLMap = Map<string, string>;

// ─── Session ─────────────────────────────────────────────────────────────────

/** A single turn in a conversation (input + bot response). */
export interface ConversationTurn {
  /** The normalised user input. */
  input: string;
  /** The bot's response. */
  response: string;
  /** Unix timestamp (ms) of the turn. */
  timestamp: number;
  /** The conversation topic at the time of this turn. */
  topic: string;
}

/**
 * Serialisable snapshot of a {@link Session}.
 *
 * Persist this with `JSON.stringify` and restore it later with
 * {@link AIMLBot.loadSerializedSession}.
 */
export interface SessionData {
  id: string;
  predicates: Record<string, string>;
  history: ConversationTurn[];
  topic: string;
  created: number;
  updated: number;
  /** AIML 2.0 triple store entries. */
  tripleStore?: TripleEntry[];
}

/** A single RDF-style subject/predicate/object triple (AIML 2.0). */
export interface TripleEntry {
  subject: string;
  predicate: string;
  object: string;
}

// ─── Bot Options ─────────────────────────────────────────────────────────────

/**
 * Constructor options shared by all bot classes.
 *
 * @example
 * const bot = new AIML1Bot({
 *   properties: { name: 'Alice', age: '21' },
 *   maxRecursionDepth: 30,
 *   defaultTopic: 'general',
 * });
 */
export interface BotOptions {
  /** Display name exposed via `<bot name="name"/>`. */
  name?: string;
  /** Initial bot properties (see {@link BotProperties}). */
  properties?: BotProperties;
  /** Override any of the built-in substitution tables. */
  substitutions?: Partial<Substitutions>;
  /** Pre-load named sets (string array, Set, or one-per-line text). */
  sets?: Record<string, string[] | Set<string>>;
  /** Pre-load named maps (object, Map, or `key:value` text). */
  maps?: Record<string, Record<string, string> | Map<string, string>>;
  /**
   * Maximum `<srai>` recursion depth before the bot gives up.
   * @default 50
   */
  maxRecursionDepth?: number;
  /**
   * Maximum `<loop>` iterations inside a `<condition>`.
   * @default 1000
   */
  maxLoopIterations?: number;
  /**
   * Default topic for new sessions.
   * @default "default"
   */
  defaultTopic?: string;
  /** BCP-47 locale used for date formatting. */
  locale?: string;
  /** IANA timezone for date/time tags. */
  timezone?: string;
}

// ─── Talk ────────────────────────────────────────────────────────────────────

/**
 * The result returned by {@link AIMLBot.talk}.
 *
 * @example
 * const { response, sessionId } = await bot.talk('hello');
 * console.log(response); // "Hi there!"
 */
export interface TalkResult {
  /** The bot's text response. */
  response: string;
  /** The session ID that was used (useful when none was passed). */
  sessionId: string;
}

// ─── File Loading ─────────────────────────────────────────────────────────────

/**
 * A source that can be loaded as an AIML file.
 *
 * Three forms are accepted:
 * - **`string`** – Node.js file-system path (server only).
 * - **`{ name, content }`** – Pre-loaded in-memory content (works everywhere).
 * - **`File`** – Browser {@link https://developer.mozilla.org/en-US/docs/Web/API/File | File} object from `<input type="file">`.
 */
export type FileSource =
  | string
  | { name: string; content: string }
  | File;

// ─── Validation ──────────────────────────────────────────────────────────────

/** A single parse/validation error or warning. */
export interface ValidationError {
  message: string;
  file?: string;
  line?: number;
  element?: string;
}

/**
 * Result of {@link validateAIML} or {@link AIMLBot.validateXML}.
 *
 * @example
 * const result = bot.validateXML(xml);
 * if (!result.valid) {
 *   for (const err of result.errors) console.error(err.message);
 * }
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ─── Match Result ─────────────────────────────────────────────────────────────

/**
 * The result of a successful pattern match.
 *
 * Contains the matched category and the wildcard captures for input,
 * `<that>`, and `<topic>` patterns respectively.
 */
export interface MatchResult {
  category: Category;
  /** Wildcard captures from the input pattern (`<star index="N"/>`). */
  stars: string[];
  /** Wildcard captures from the `<that>` pattern (`<thatstar index="N"/>`). */
  thatStars: string[];
  /** Wildcard captures from the `<topic>` pattern (`<topicstar index="N"/>`). */
  topicStars: string[];
}

// ─── Interpreter Context ──────────────────────────────────────────────────────

/** @internal Runtime context passed through the template processor. */
export interface InterpreterContext {
  session: import('./core/Session').Session;
  matchResult: MatchResult;
  recursionDepth: number;
  loopCount: number;
  input: string;
  /**
   * AIML 2.0 local variables (`var` attribute on `<set>`/`<get>`/`<condition>`).
   * Scoped to the current template execution; start with value "unknown".
   */
  localVars: Map<string, string>;
}

// ─── Node (cross-platform DOM) ────────────────────────────────────────────────

export type { Node, Element, Document } from '@xmldom/xmldom';
