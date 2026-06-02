/**
 * @module Normalizer
 * @category Core
 */
import type { Substitutions, SubstitutionPair } from '../types';

/**
 * Apply a list of substitution rules to a string in a single pass.
 *
 * **Single-pass** means that replacement text produced by one rule is never
 * matched by a subsequent rule in the same call — this avoids the classic
 * gender-substitution problem where "he → she → he" loops.
 *
 * @param text  The input string.
 * @param pairs Ordered list of substitution rules.
 */
export function applySubstitutions(text: string, pairs: SubstitutionPair[]): string {
  if (pairs.length === 0) return text;
  const combined = new RegExp(
    pairs.map(p => p.find.source).join('|'),
    'gi',
  );
  return text.replace(combined, (match) => {
    for (const { find, replace } of pairs) {
      find.lastIndex = 0;
      if (find.test(match)) {
        find.lastIndex = 0;
        return replace;
      }
    }
    return match;
  });
}

/**
 * Compile a find/replace pair into a {@link SubstitutionPair}.
 *
 * The `find` string is matched as a whole word (word-boundary anchors are added
 * automatically) and the regex is global and case-insensitive.
 *
 * @param find    The text to find (not a regex — special chars are escaped).
 * @param replace The replacement string.
 *
 * @example
 * const pair = buildSubstitutionPair("can't", "cannot");
 * "I can't do it".replace(pair.find, pair.replace); // "I cannot do it"
 */
export function buildSubstitutionPair(find: string, replace: string): SubstitutionPair {
  const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    find: new RegExp(`(?<![a-zA-Z])${escaped}(?![a-zA-Z])`, 'gi'),
    replace,
  };
}

/**
 * Return a sensible set of built-in substitution tables.
 *
 * These cover common English pronoun swaps (person, person2, gender) and
 * are the defaults used when no substitutions are explicitly provided.
 */
export function createDefaultSubstitutions(): Substitutions {
  return {
    normal: [],
    person: [
      buildSubstitutionPair("I am", "he or she is"),
      buildSubstitutionPair("I was", "he or she was"),
      buildSubstitutionPair("I", "he or she"),
      buildSubstitutionPair("me", "him or her"),
      buildSubstitutionPair("my", "his or her"),
      buildSubstitutionPair("myself", "him or herself"),
      buildSubstitutionPair("mine", "his or hers"),
    ],
    person2: [
      buildSubstitutionPair("I am", "you are"),
      buildSubstitutionPair("I was", "you were"),
      buildSubstitutionPair("I", "you"),
      buildSubstitutionPair("me", "you"),
      buildSubstitutionPair("my", "your"),
      buildSubstitutionPair("myself", "yourself"),
      buildSubstitutionPair("mine", "yours"),
    ],
    gender: [
      buildSubstitutionPair("himself", "herself"),
      buildSubstitutionPair("herself", "himself"),
      buildSubstitutionPair("him", "her"),
      buildSubstitutionPair("her", "him"),
      buildSubstitutionPair("his", "her"),
      buildSubstitutionPair("he", "she"),
      buildSubstitutionPair("she", "he"),
    ],
    denormal: [],
  };
}

/**
 * Text normalisation engine.
 *
 * The `Normalizer` applies ordered substitution tables to transform text
 * before matching (input normalisation) and after generation (denormalisation).
 * It also provides the pronoun-swap transforms used by AIML template tags
 * (`<person>`, `<person2>`, `<gender>`) and string-case helpers.
 *
 * All substitutions are applied in a **single pass** (see {@link applySubstitutions}),
 * so rules cannot inadvertently match text introduced by earlier rules.
 *
 * @example
 * ```ts
 * const norm = new Normalizer();
 * norm.updateSubstitutions('normal', [
 *   buildSubstitutionPair("can't", 'cannot'),
 *   buildSubstitutionPair("won't", 'will not'),
 * ]);
 *
 * norm.normalize("I can't do it"); // → "I cannot do it"
 * norm.person("I am happy");       // → "he or she is happy"
 * norm.gender("he called her");    // → "she called him"
 * ```
 *
 * @category Core
 */
export class Normalizer {
  private substitutions: Substitutions;

  /**
   * @param substitutions Override any built-in table.  Omitted tables
   *   fall back to {@link createDefaultSubstitutions}.
   */
  constructor(substitutions?: Partial<Substitutions>) {
    const defaults = createDefaultSubstitutions();
    this.substitutions = {
      normal:   substitutions?.normal   ?? defaults.normal,
      person:   substitutions?.person   ?? defaults.person,
      person2:  substitutions?.person2  ?? defaults.person2,
      gender:   substitutions?.gender   ?? defaults.gender,
      denormal: substitutions?.denormal ?? defaults.denormal,
    };
  }

  /**
   * Replace an entire substitution table.
   * @param type  Which table to replace.
   * @param pairs New substitution rules.
   */
  updateSubstitutions(type: keyof Substitutions, pairs: SubstitutionPair[]): void {
    this.substitutions[type] = pairs;
  }

  /**
   * Append rules to an existing substitution table.
   * @param type  Which table to extend.
   * @param pairs Rules to append.
   */
  addSubstitutions(type: keyof Substitutions, pairs: SubstitutionPair[]): void {
    this.substitutions[type].push(...pairs);
  }

  /**
   * Normalise user input before pattern matching.
   *
   * Applies the `normal` substitution table (contractions, punctuation, etc.)
   * and collapses multiple spaces.
   */
  normalize(text: string): string {
    let result = text.trim();
    // Strip trailing sentence-ending punctuation (standard AIML pre-processing).
    // This makes "hello?" and "hello" both match the pattern HELLO.
    result = result.replace(/[?!]+$/, '').trimEnd();
    // Strip a lone trailing period (but not abbreviations like "Dr.")
    result = result.replace(/\s\.$/, '');
    result = applySubstitutions(result, this.substitutions.normal);
    result = result.replace(/\s+/g, ' ').trim();
    return result;
  }

  /**
   * Reverse normalisation applied to bot output.
   * Uses the `denormal` substitution table.
   */
  denormalize(text: string): string {
    return applySubstitutions(text, this.substitutions.denormal);
  }

  /**
   * Apply first↔third person pronoun substitution.
   * Used by the `<person>` template tag.
   */
  person(text: string): string {
    return applySubstitutions(text, this.substitutions.person);
  }

  /**
   * Apply first↔second person pronoun substitution.
   * Used by the `<person2>` template tag.
   */
  person2(text: string): string {
    return applySubstitutions(text, this.substitutions.person2);
  }

  /**
   * Apply gender pronoun substitution (he↔she, him↔her, …).
   * Used by the `<gender>` template tag.
   */
  gender(text: string): string {
    return applySubstitutions(text, this.substitutions.gender);
  }

  /** Convert text to `UPPER CASE`. */
  uppercase(text: string): string { return text.toUpperCase(); }

  /** Convert text to `lower case`. */
  lowercase(text: string): string { return text.toLowerCase(); }

  /** Capitalise the first letter of every word (`Title Case`). */
  formal(text: string): string {
    return text.replace(/\b\w/g, c => c.toUpperCase());
  }

  /** Capitalise only the very first character (`Sentence case`). */
  sentence(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /**
   * Insert a space between every character.
   * Used by the `<explode>` template tag.
   *
   * @example
   * explode('abc') // → 'a b c'
   */
  explode(text: string): string {
    return text.split('').join(' ');
  }
}
