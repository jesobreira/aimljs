/**
 * @module DataParser
 * @category Parsers
 *
 * Utilities for parsing the auxiliary data files used alongside AIML knowledge bases:
 * properties, substitution tables, named sets, and named maps.
 *
 * Each parser accepts both a **text** format and a **JSON** format, and
 * auto-detects which one is being used based on the first non-whitespace
 * character of the input.
 *
 * ### Text formats
 *
 * | Type          | Format                                  |
 * |---------------|-----------------------------------------|
 * | Properties    | `key:value` or `key=value`, one per line |
 * | Substitutions | `find : replace`, one per line          |
 * | Sets          | one item per line                       |
 * | Maps          | `key : value`, one per line             |
 *
 * Lines starting with `#` or `;` are treated as comments.
 *
 * ### JSON formats
 *
 * | Type          | Format                                                     |
 * |---------------|------------------------------------------------------------|
 * | Properties    | `{ "key": "value" }`                                       |
 * | Substitutions | `[{ "find": "...", "replace": "..." }]` or `{ "find": "replace" }` |
 * | Sets          | `["item1", "item2"]`                                       |
 * | Maps          | `{ "key": "value" }`                                       |
 */

import type { SubstitutionPair, AIMLSet, AIMLMap } from '../types';
import { buildSubstitutionPair } from '../core/Normalizer';

// ─── Properties ──────────────────────────────────────────────────────────────

/**
 * Parse a properties text file.
 *
 * Each non-blank, non-comment line must contain a separator (`:` or `=`).
 * Keys are lower-cased.
 *
 * @example
 * parsePropertiesText(`
 *   name : Alice
 *   age  : 21
 *   # this is a comment
 * `)
 * // → { name: 'Alice', age: '21' }
 *
 * @category Parsers
 */
export function parsePropertiesText(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue;
    const colonIdx = trimmed.indexOf(':');
    const eqIdx = trimmed.indexOf('=');
    let sep = -1;
    if (colonIdx !== -1 && eqIdx !== -1) sep = Math.min(colonIdx, eqIdx);
    else if (colonIdx !== -1) sep = colonIdx;
    else if (eqIdx !== -1) sep = eqIdx;
    if (sep === -1) continue;
    const key = trimmed.slice(0, sep).trim().toLowerCase();
    const value = trimmed.slice(sep + 1).trim();
    result[key] = value;
  }
  return result;
}

/**
 * Parse a JSON properties object.  Keys are lower-cased.
 *
 * @example
 * parsePropertiesJSON('{"name":"Alice","version":"1.0"}')
 * // → { name: 'Alice', version: '1.0' }
 *
 * @category Parsers
 */
export function parsePropertiesJSON(json: string): Record<string, string> {
  try {
    const obj = JSON.parse(json);
    const result: Record<string, string> = {};
    // Object format: {"key":"value"}
    if (!Array.isArray(obj)) {
      for (const [k, v] of Object.entries(obj)) {
        result[k.toLowerCase()] = String(v);
      }
      return result;
    }
    // Array-of-arrays format (Pandorabots/Rosie): [["key","value"], ...]
    for (const entry of obj) {
      if (Array.isArray(entry) && entry.length >= 2) {
        result[String(entry[0]).toLowerCase()] = String(entry[1]);
      }
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Parse properties from any supported format (auto-detected).
 *
 * - If `data` is already a plain object, keys are lower-cased and returned.
 * - If `data` is a JSON string (starts with `{`), {@link parsePropertiesJSON} is used.
 * - Otherwise, {@link parsePropertiesText} is used.
 *
 * @example
 * // From object
 * parseProperties({ Name: 'Alice' })                // → { name: 'Alice' }
 * // From JSON string
 * parseProperties('{"name":"Alice"}')               // → { name: 'Alice' }
 * // From text
 * parseProperties('name:Alice\nversion:1.0')        // → { name:'Alice', version:'1.0' }
 *
 * @category Parsers
 */
export function parseProperties(data: string | Record<string, string>): Record<string, string> {
  if (typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k.toLowerCase(), String(v)]),
    );
  }
  const trimmed = data.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return parsePropertiesJSON(trimmed);
  return parsePropertiesText(trimmed);
}

// ─── Substitutions ────────────────────────────────────────────────────────────

/**
 * Parse substitution rules from a text file.
 *
 * Each line should be `find : replace`.  Lines starting with `#` are comments.
 *
 * @example
 * parseSubstitutionsText("can't : cannot\nwon't : will not")
 * // → [SubstitutionPair for "can't"→"cannot", ...]
 *
 * @category Parsers
 */
export function parseSubstitutionsText(text: string): SubstitutionPair[] {
  const pairs: SubstitutionPair[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const find = trimmed.slice(0, colonIdx).trim();
    const replace = trimmed.slice(colonIdx + 1).trim();
    if (find) pairs.push(buildSubstitutionPair(find, replace));
  }
  return pairs;
}

/**
 * Parse substitution rules from a JSON string.
 *
 * Accepts two shapes:
 * - Array: `[{ "find": "can't", "replace": "cannot" }, ...]`
 * - Object: `{ "can't": "cannot", "won't": "will not" }`
 *
 * @category Parsers
 */
export function parseSubstitutionsJSON(json: string): SubstitutionPair[] {
  try {
    const obj = JSON.parse(json);
    if (Array.isArray(obj)) {
      // Array-of-arrays format (Pandorabots/Rosie): [["find","replace"], ...]
      if (obj.length > 0 && Array.isArray(obj[0])) {
        return obj
          .filter(item => Array.isArray(item) && item.length >= 2)
          .map(item => buildSubstitutionPair(String(item[0]), String(item[1])));
      }
      // Array-of-objects format: [{"find":"...","replace":"..."}, ...]
      return obj
        .filter(item => item.find && typeof item.replace === 'string')
        .map(item => buildSubstitutionPair(String(item.find), String(item.replace)));
    }
    // Object format: {"find":"replace"}
    if (typeof obj === 'object') {
      return Object.entries(obj).map(([find, replace]) =>
        buildSubstitutionPair(find, String(replace)),
      );
    }
  } catch { /* ignore */ }
  return [];
}

/**
 * Parse substitution rules from any supported format (auto-detected).
 *
 * - If `data` is already a `SubstitutionPair[]`, it is returned as-is.
 * - If the string starts with `[` or `{`, {@link parseSubstitutionsJSON} is used.
 * - Otherwise, {@link parseSubstitutionsText} is used.
 *
 * @category Parsers
 */
export function parseSubstitutions(data: string | SubstitutionPair[]): SubstitutionPair[] {
  if (Array.isArray(data)) return data;
  const trimmed = data.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) return parseSubstitutionsJSON(trimmed);
  return parseSubstitutionsText(trimmed);
  // Note: sets and maps already check for '[' so no change needed there
}

// ─── Sets ────────────────────────────────────────────────────────────────────

/**
 * Parse a named set from a text file.
 *
 * One item per line; blank lines and `#`-prefixed comments are ignored.
 * All items are lower-cased.
 *
 * @example
 * parseSetText('red\ngreen\nblue\n# primary colours')
 * // → Set { 'red', 'green', 'blue' }
 *
 * @category Parsers
 */
export function parseSetText(text: string): AIMLSet {
  const set = new Set<string>();
  for (const line of text.split('\n')) {
    const trimmed = line.trim().toLowerCase();
    if (trimmed && !trimmed.startsWith('#')) set.add(trimmed);
  }
  return set;
}

/**
 * Parse a named set from a JSON array string.
 *
 * @example
 * parseSetJSON('["cat","dog","fish"]') // → Set { 'cat', 'dog', 'fish' }
 *
 * @category Parsers
 */
export function parseSetJSON(json: string): AIMLSet {
  try {
    const arr = JSON.parse(json);
    if (Array.isArray(arr)) {
      // Array-of-arrays format (Pandorabots/Rosie): [["word1","word2",...], ...]
      // Each sub-array's elements are joined with a space to form one entry.
      if (arr.length > 0 && Array.isArray(arr[0])) {
        return new Set(arr.map(item => (item as string[]).join(' ').toLowerCase()));
      }
      // Flat array: ["item1","item2",...]
      return new Set(arr.map(v => String(v).toLowerCase()));
    }
  } catch { /* ignore */ }
  return new Set();
}

/**
 * Parse a named set from any supported format (auto-detected).
 *
 * - `Set<string>` → items are lower-cased and returned.
 * - `string[]`    → items are lower-cased.
 * - JSON string starting with `[` → {@link parseSetJSON}.
 * - Otherwise → {@link parseSetText}.
 *
 * @example
 * parseSet(['Red', 'Green', 'Blue'])  // → Set { 'red', 'green', 'blue' }
 * parseSet('["cat","dog"]')           // → Set { 'cat', 'dog' }
 * parseSet('cat\ndog\nfish')          // → Set { 'cat', 'dog', 'fish' }
 *
 * @category Parsers
 */
export function parseSet(data: string | string[] | Set<string>): AIMLSet {
  if (data instanceof Set) return new Set([...data].map(v => v.toLowerCase()));
  if (Array.isArray(data)) return new Set(data.map(v => v.toLowerCase()));
  const trimmed = data.trim();
  if (trimmed.startsWith('[')) return parseSetJSON(trimmed);
  return parseSetText(trimmed);
}

// ─── Maps ────────────────────────────────────────────────────────────────────

/**
 * Parse a named map from a text file.
 *
 * Each non-blank, non-comment line must be `key : value`.
 * Keys are lower-cased; values are preserved as-is.
 *
 * @example
 * parseMapText('france : Paris\ngermany : Berlin')
 * // → Map { 'france' → 'Paris', 'germany' → 'Berlin' }
 *
 * @category Parsers
 */
export function parseMapText(text: string): AIMLMap {
  const map = new Map<string, string>();
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
    const value = trimmed.slice(colonIdx + 1).trim();
    if (key) map.set(key, value);
  }
  return map;
}

/**
 * Parse a named map from a JSON object string.
 *
 * @example
 * parseMapJSON('{"france":"Paris","germany":"Berlin"}')
 * // → Map { 'france' → 'Paris', 'germany' → 'Berlin' }
 *
 * @category Parsers
 */
export function parseMapJSON(json: string): AIMLMap {
  const map = new Map<string, string>();
  try {
    const obj = JSON.parse(json);
    // Array-of-arrays format (Pandorabots/Rosie): [["key","value"], ...]
    if (Array.isArray(obj)) {
      for (const entry of obj) {
        if (Array.isArray(entry) && entry.length >= 2) {
          map.set(String(entry[0]).toLowerCase(), String(entry[1]));
        }
      }
      return map;
    }
    // Object format: {"key":"value"}
    if (typeof obj === 'object') {
      for (const [k, v] of Object.entries(obj)) {
        map.set(k.toLowerCase(), String(v));
      }
    }
  } catch { /* ignore */ }
  return map;
}

/**
 * Parse a named map from any supported format (auto-detected).
 *
 * - `Map<string, string>` → keys are lower-cased and returned.
 * - Plain object → keys are lower-cased.
 * - JSON string starting with `{` → {@link parseMapJSON}.
 * - Otherwise → {@link parseMapText}.
 *
 * @example
 * parseMap({ France: 'Paris' })           // → Map { 'france' → 'Paris' }
 * parseMap('{"france":"Paris"}')          // → Map { 'france' → 'Paris' }
 * parseMap('france : Paris\njapan : Tokyo') // text format
 *
 * @category Parsers
 */
export function parseMap(
  data: string | Record<string, string> | Map<string, string>,
): AIMLMap {
  if (data instanceof Map) {
    return new Map([...data].map(([k, v]) => [k.toLowerCase(), v]));
  }
  if (typeof data === 'object') {
    return new Map(Object.entries(data).map(([k, v]) => [k.toLowerCase(), String(v)]));
  }
  const trimmed = data.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return parseMapJSON(trimmed);
  return parseMapText(trimmed);
}
