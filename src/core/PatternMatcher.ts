/**
 * @module PatternMatcher
 * @category Core
 */
import type { Category, MatchResult, ParsedPattern, PatternToken, WildcardChar, AIMLSet } from '../types';

// ─── Pattern priority weights ─────────────────────────────────────────────────
// AIML 2.0: # > _ > exact/set/bot > ^ > *
// AIML 1.0: _ > exact > *  (# and ^ treated as exact words in 1.0)
//
// Priority is POSITIONAL: at each token position, the priority of that token
// determines precedence. Position 0 matters most, position 1 next, etc.
// We use BASE^(MAX_POS - pos) as a positional weight.

const TOKEN_PRIORITY = {
  wildcard: { '#': 7, '_': 6, '^': 4, '*': 3 } as Record<WildcardChar, number>,
  exact: 5,
  set: 5,
  bot: 5,
};

const SCORE_BASE = 8;
const SCORE_MAX_POS = 20;

function scorePattern(pattern: ParsedPattern): number {
  let score = 0;
  const tokens = pattern.tokens;
  for (let i = 0; i < Math.min(tokens.length, SCORE_MAX_POS); i++) {
    const t = tokens[i];
    const pri = t.type === 'wildcard'
      ? (TOKEN_PRIORITY.wildcard[t.char] ?? 3)
      : TOKEN_PRIORITY[t.type];
    score += pri * Math.pow(SCORE_BASE, SCORE_MAX_POS - 1 - i);
  }
  return score;
}

function totalScore(cat: Category): number {
  // Input pattern is most significant, then that, then topic
  return scorePattern(cat.pattern) * 1e14 +
         scorePattern(cat.that) * 1e7 +
         scorePattern(cat.topic);
}

// ─── Token matching ───────────────────────────────────────────────────────────

interface MatchState {
  words: string[];
  wordIndex: number;
  tokens: PatternToken[];
  tokenIndex: number;
  captured: string[];
  sets: Map<string, AIMLSet>;
  botProps: Record<string, string>;
}

function matchSegment(state: MatchState): string[] | null {
  const { words, tokens } = state;

  function inner(wi: number, ti: number, cap: string[]): string[] | null {
    if (wi === words.length && ti === tokens.length) return cap;
    if (ti === tokens.length) return null;

    const token = tokens[ti];

    if (token.type === 'exact') {
      if (wi >= words.length) return null;
      if (words[wi].toLowerCase() !== token.word.toLowerCase()) return null;
      return inner(wi + 1, ti + 1, cap);
    }

    if (token.type === 'bot') {
      const val = (state.botProps[token.name] || '').toLowerCase();
      const valWords = val.split(/\s+/).filter(Boolean);
      for (let k = 0; k < valWords.length; k++) {
        if (wi + k >= words.length) return null;
        if (words[wi + k].toLowerCase() !== valWords[k]) return null;
      }
      return inner(wi + valWords.length, ti + 1, cap);
    }

    if (token.type === 'set') {
      if (wi >= words.length) return null;
      const set = state.sets.get(token.name.toLowerCase());
      if (!set) return null;
      for (let len = Math.min(words.length - wi, 5); len >= 1; len--) {
        const phrase = words.slice(wi, wi + len).join(' ');
        if (set.has(phrase.toLowerCase())) {
          const result = inner(wi + len, ti + 1, [...cap, phrase]);
          if (result) return result;
        }
      }
      return null;
    }

    // Wildcard
    const char = token.char;
    const minWords = (char === '#' || char === '^') ? 0 : 1;
    const maxWords = words.length - wi;

    // Greedy: try longest match first for _ and #, shortest for * and ^
    const order = (char === '_' || char === '#')
      ? Array.from({ length: maxWords - minWords + 1 }, (_, i) => maxWords - i)
      : Array.from({ length: maxWords - minWords + 1 }, (_, i) => minWords + i);

    for (const len of order) {
      const captured_words = words.slice(wi, wi + len).join(' ');
      const result = inner(wi + len, ti + 1, [...cap, captured_words]);
      if (result) return result;
    }
    return null;
  }

  return inner(state.wordIndex, state.tokenIndex, state.captured);
}

// ─── PatternMatcher ───────────────────────────────────────────────────────────

/**
 * Low-level pattern matching engine.
 *
 * Stores a list of {@link Category} objects and efficiently finds the
 * highest-priority match for a given (input, that, topic) triple.
 *
 * Priority follows the AIML specification:
 * - AIML 1.0: `_` > exact > `*`
 * - AIML 2.0: `#` > `_` > exact/set > `^` > `*`
 *
 * You do not normally need to use this class directly — the bot classes
 * ({@link AIMLBot}, {@link AIML1Bot}, {@link AIML2Bot}) manage it internally.
 *
 * @example
 * ```ts
 * const matcher = new PatternMatcher();
 * matcher.addCategories(parseAIML(xml).categories);
 *
 * const result = matcher.match('hello world', '*', '*');
 * if (result) {
 *   console.log('stars:', result.stars); // wildcard captures
 * }
 * ```
 *
 * @category Core
 */
export class PatternMatcher {
  private categories: Category[] = [];
  private sorted = false;
  private sets: Map<string, AIMLSet> = new Map();
  private botProps: Record<string, string> = {};

  /**
   * Add a single category to the matcher.
   * Triggers a re-sort on the next {@link match} call.
   */
  addCategory(cat: Category): void {
    this.categories.push(cat);
    this.sorted = false;
  }

  /**
   * Add multiple categories at once.
   * More efficient than calling {@link addCategory} in a loop.
   */
  addCategories(cats: Category[]): void {
    this.categories.push(...cats);
    this.sorted = false;
  }

  /**
   * Remove all categories that were loaded from a specific file.
   * Useful for hot-reloading individual AIML files.
   *
   * @param file The file name/path to remove categories from.
   */
  removeByFile(file: string): void {
    this.categories = this.categories.filter(c => c.file !== file);
    this.sorted = false;
  }

  /** Remove all categories. */
  clear(): void {
    this.categories = [];
    this.sorted = false;
  }

  /**
   * Register a named set for use in `<set name="...">` pattern tokens.
   *
   * @param name Set name (case-insensitive).
   * @param set  Set of lower-cased strings.
   */
  setSet(name: string, set: AIMLSet): void {
    this.sets.set(name.toLowerCase(), set);
  }

  /**
   * Provide the current bot properties so `<bot name="...">` pattern
   * tokens can be evaluated during matching.
   */
  setBotProperties(props: Record<string, string>): void {
    this.botProps = props;
  }

  /** Total number of loaded categories. */
  get size(): number {
    return this.categories.length;
  }

  private ensureSorted(): void {
    if (!this.sorted) {
      // Sort descending: higher score = higher priority = checked first
      this.categories.sort((a, b) => totalScore(b) - totalScore(a));
      this.sorted = true;
    }
  }

  /**
   * Find the highest-priority category that matches the given triple.
   *
   * All three strings are tokenised and matched against the stored patterns.
   * Returns `null` if no category matches.
   *
   * @param input Normalised user input.
   * @param that  Last bot sentence (use `"*"` if no prior response).
   * @param topic Current conversation topic (use `"default"` if unset).
   *
   * @example
   * ```ts
   * const result = matcher.match('my name is Alice', '*', 'default');
   * // result.category → the matched Category
   * // result.stars[0] → 'Alice'
   * ```
   */
  match(
    input: string,
    that: string,
    topic: string,
  ): MatchResult | null {
    this.ensureSorted();

    const inputWords = tokenize(input);
    const thatWords = tokenize(that);
    const topicWords = tokenize(topic);

    const matchCtx = { sets: this.sets, botProps: this.botProps };

    for (const cat of this.categories) {
      const stars = matchPattern(cat.pattern.tokens, inputWords, matchCtx);
      if (stars === null) continue;

      const thatStars = matchPattern(cat.that.tokens, thatWords, matchCtx);
      if (thatStars === null) continue;

      const topicStars = matchPattern(cat.topic.tokens, topicWords, matchCtx);
      if (topicStars === null) continue;

      return { category: cat, stars, thatStars, topicStars };
    }
    return null;
  }
}

function matchPattern(
  tokens: PatternToken[],
  words: string[],
  ctx: { sets: Map<string, AIMLSet>; botProps: Record<string, string> },
): string[] | null {
  const state: MatchState = {
    words,
    wordIndex: 0,
    tokens,
    tokenIndex: 0,
    captured: [],
    sets: ctx.sets,
    botProps: ctx.botProps,
  };
  return matchSegment(state);
}

/**
 * Split text into an array of words (tokens) for pattern matching.
 *
 * Trims leading/trailing whitespace and collapses internal whitespace.
 *
 * @example
 * tokenize('  hello   world  ') // → ['hello', 'world']
 * tokenize('')                  // → []
 */
export function tokenize(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

// ─── Pattern parsing ──────────────────────────────────────────────────────────

/**
 * Parse a raw AIML pattern string into a {@link ParsedPattern}.
 *
 * Supports:
 * - Exact words
 * - Wildcards: `*`, `_` (AIML 1.0); `#`, `^` (AIML 2.0 only)
 * - Set references: `<set name="color">` or `<set>color</set>`
 * - Bot property references: `<bot name="name">`
 *
 * @param raw         The pattern string (may contain inline XML tags).
 * @param aimlVersion Determines which wildcards are recognised.
 *
 * @example
 * parsePattern('HELLO *')
 * // → { tokens: [{ type:'exact', word:'HELLO' }, { type:'wildcard', char:'*' }], raw:'HELLO *' }
 *
 * parsePattern('I LIKE <set name="color">', '1.0')
 * // → { tokens: [..., { type:'set', name:'color' }], raw:'...' }
 */
export function parsePattern(raw: string, aimlVersion: '1.0' | '2.0' = '1.0'): ParsedPattern {
  const tokens: PatternToken[] = [];
  const normalized = raw.trim().toUpperCase();

  let i = 0;
  let wordBuffer = '';

  const flushWord = () => {
    if (wordBuffer.trim()) {
      const word = wordBuffer.trim();
      if (word === '*' || word === '_' || (aimlVersion === '2.0' && (word === '#' || word === '^'))) {
        tokens.push({ type: 'wildcard', char: word as WildcardChar });
      } else {
        tokens.push({ type: 'exact', word });
      }
      wordBuffer = '';
    }
  };

  while (i < normalized.length) {
    if (normalized[i] === '<') {
      flushWord();
      const end = normalized.indexOf('>', i);
      if (end === -1) { wordBuffer += normalized[i++]; continue; }
      const tag = normalized.slice(i + 1, end).trim();
      i = end + 1;

      if (tag.startsWith('SET ') || tag.startsWith('SET\t')) {
        const nameMatch = tag.match(/NAME\s*=\s*["']?([^"'\s>]+)["']?/i);
        if (nameMatch) tokens.push({ type: 'set', name: nameMatch[1].toLowerCase() });
      } else if (tag.startsWith('BOT ') || tag.startsWith('BOT\t')) {
        const nameMatch = tag.match(/NAME\s*=\s*["']?([^"'\s>]+)["']?/i);
        if (nameMatch) tokens.push({ type: 'bot', name: nameMatch[1].toLowerCase() });
      }
    } else if (normalized[i] === ' ' || normalized[i] === '\t' || normalized[i] === '\n' || normalized[i] === '\r') {
      flushWord();
      i++;
    } else {
      wordBuffer += normalized[i++];
    }
  }
  flushWord();

  return { tokens, raw: raw.trim() };
}

/** @internal Default wildcard-star pattern, used as the default `<that>` and `<topic>`. */
export const WILDCARD_STAR = parsePattern('*');
