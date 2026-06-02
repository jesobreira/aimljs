/**
 * @module AIML2Bot
 * @category Bots
 */
import { AIMLBot, type AIMLBotOptions } from './AIMLBot';
import type { FileSource } from '../types';
import { loadFileSource } from '../loaders/FileLoader';

/**
 * Constructor options specific to {@link AIML2Bot}.
 */
export interface AIML2BotOptions extends AIMLBotOptions {
  /**
   * Handler for `<sraix service="...">` tags.
   *
   * Called with the service name and the evaluated inner text.
   * Return the response string, or throw to trigger the `default` attribute.
   *
   * @example
   * ```ts
   * const bot = new AIML2Bot({
   *   sraixHandler: async (service, input) => {
   *     if (service === 'weather') return await fetchWeather(input);
   *     return '';
   *   }
   * });
   * ```
   */
  sraixHandler?: (service: string, input: string) => Promise<string>;
}

/**
 * AIML 2.0 bot.
 *
 * Extends {@link AIMLBot} with the full AIML 2.0 feature set:
 *
 * **Additional wildcards**
 * - `#` — zero or more words (highest priority)
 * - `^` — zero or more words (lower priority than `*`)
 *
 * **Additional template tags**
 * | Tag | Description |
 * |-----|-------------|
 * | `<sraix service="...">` | Call an external service |
 * | `<map name="...">` | Look up a value in a named map |
 * | `<normalize>` / `<denormalize>` | Apply normalisation transforms |
 * | `<explode>` | Insert spaces between each character |
 * | `<first>` / `<rest>` | First word / remaining words of a string |
 * | `<request index="N">` | Nth previous user input |
 * | `<response index="N">` | Nth previous bot response |
 * | `<learn>` / `<learnf>` | Teach the bot new categories at runtime |
 * | `<eval>` | Evaluate AIML inside `<learn>` |
 * | `<loop/>` | Loop a `<condition>` branch |
 * | `<oob>` | Pass out-of-band instructions to the caller |
 * | `<addtriple>` / `<deletetriple>` | Manage the session triple store |
 * | `<select>` / `<uniq>` | Query the triple store |
 *
 * **Data file formats**
 * Properties, substitutions, sets, and maps are all accepted as either
 * plain text **or** JSON — the format is auto-detected.
 *
 * ---
 *
 * ### Basic usage
 *
 * ```ts
 * import { AIML2Bot } from 'aimljs';
 *
 * const bot = new AIML2Bot({
 *   properties: { name: 'Rosie' },
 *   sraixHandler: async (service, input) => fetchExternalBot(service, input),
 * });
 * await bot.loadDataDirectory('./rosie');
 *
 * const { response } = await bot.talk('hello');
 * ```
 *
 * ### Triple store
 *
 * ```ts
 * // AIML:  <addtriple><subj><star/></subj><pred>likes</pred><obj><star index="2"/></obj></addtriple>
 * await bot.talk('Alice likes cats');
 * const session = bot.getSession(sessionId)!;
 * session.queryTriples('alice', 'likes'); // → [{ subject:'alice', predicate:'likes', object:'cats' }]
 * ```
 *
 * @category Bots
 */
export class AIML2Bot extends AIMLBot {
  private sraixHandler?: (service: string, input: string) => Promise<string>;

  constructor(options: AIML2BotOptions = {}) {
    super({ ...options, aimlVersion: '2.0' });
    this.botProperties.aiml_version = '2.0';
    this.sraixHandler = options.sraixHandler;
    (this.processor as any).deps.sraix = this.handleSraix.bind(this);
  }

  private async handleSraix(service: string, input: string): Promise<string> {
    if (this.sraixHandler) {
      return this.sraixHandler(service, input);
    }
    return '';
  }

  /**
   * Set or replace the `<sraix>` handler after construction.
   *
   * @param handler A function that receives the service name and input text
   *   and returns the service's response.
   *
   * @example
   * ```ts
   * bot.setSraixHandler(async (service, input) => {
   *   const res = await fetch(`https://api.example.com/${service}?q=${input}`);
   *   return res.text();
   * });
   * ```
   */
  setSraixHandler(handler: (service: string, input: string) => Promise<string>): void {
    this.sraixHandler = handler;
  }

  /**
   * Load bot properties from a file (JSON or `key:value` text, auto-detected).
   *
   * @param source A {@link FileSource}.
   *
   * @example
   * await bot.loadPropertiesFile('/path/to/properties.json');
   * await bot.loadPropertiesFile('/path/to/properties.txt');
   */
  async loadPropertiesFile(source: FileSource): Promise<void> {
    const { content } = await loadFileSource(source);
    this.loadProperties(content);
  }

  /**
   * Load a substitution table from a file (JSON or text, auto-detected).
   *
   * JSON array format: `[{ "find": "...", "replace": "..." }]`
   * JSON object format: `{ "find": "replace" }`
   * Text format: `find : replace` (one per line)
   *
   * @param type   Which table to replace.
   * @param source A {@link FileSource}.
   *
   * @example
   * await bot.loadSubstitutionFile('normal', '/path/to/normal.json');
   */
  async loadSubstitutionFile(
    type: 'normal' | 'person' | 'person2' | 'gender' | 'denormal',
    source: FileSource,
  ): Promise<void> {
    const { content } = await loadFileSource(source);
    this.loadSubstitutions(type, content);
  }

  /**
   * Load a named set from a file (JSON array or text, auto-detected).
   *
   * @param name   Set name.
   * @param source A {@link FileSource}.
   *
   * @example
   * await bot.loadSetFile('color', '/path/to/colors.json');  // ["red","green","blue"]
   * await bot.loadSetFile('color', '/path/to/colors.txt');   // one per line
   */
  async loadSetFile(name: string, source: FileSource): Promise<void> {
    const { content } = await loadFileSource(source);
    this.loadSet(name, content);
  }

  /**
   * Load a named map from a file (JSON object or text, auto-detected).
   *
   * @param name   Map name.
   * @param source A {@link FileSource}.
   *
   * @example
   * await bot.loadMapFile('capitals', '/path/to/capitals.json');  // {"france":"Paris"}
   * await bot.loadMapFile('capitals', '/path/to/capitals.txt');   // france : Paris
   */
  async loadMapFile(name: string, source: FileSource): Promise<void> {
    const { content } = await loadFileSource(source);
    this.loadMap(name, content);
  }

  /**
   * Load a complete AIML 2.0 data directory using the standard layout.
   *
   * Expected structure (all optional):
   * ```
   * <dir>/
   *   *.aiml                          ← AIML files (non-recursive)
   *   properties.json | properties.txt
   *   substitutions/
   *     normal.json | normal.txt
   *     person.json | person.txt
   *     person2.json | person2.txt
   *     gender.json | gender.txt
   *     denormal.json | denormal.txt
   *   sets/
   *     <name>.json | <name>.txt      ← set name = file basename
   *   maps/
   *     <name>.json | <name>.txt      ← map name = file basename
   * ```
   *
   * **Node.js only.**
   *
   * @param dirPath Absolute or relative path to the data directory.
   *
   * @example
   * ```ts
   * const bot = new AIML2Bot();
   * await bot.loadDataDirectory('./rosie');
   * ```
   */
  async loadDataDirectory(dirPath: string): Promise<void> {
    if (typeof process === 'undefined') {
      throw new Error('loadDataDirectory is only available in Node.js');
    }
    const fs = await import('fs/promises');
    const path = await import('path');

    const tryLoad = async (relPath: string): Promise<string | null> => {
      try {
        return await fs.readFile(path.join(dirPath, relPath), 'utf-8');
      } catch { return null; }
    };

    const tryLoadDir = async (subdir: string): Promise<Array<{ name: string; content: string }>> => {
      const results: Array<{ name: string; content: string }> = [];
      try {
        const full = path.join(dirPath, subdir);
        const entries = await fs.readdir(full, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isFile()) continue;
          const content = await fs.readFile(path.join(full, entry.name), 'utf-8');
          const baseName = path.basename(entry.name, path.extname(entry.name));
          results.push({ name: baseName, content });
        }
      } catch { /* directory not found */ }
      return results;
    };

    // Properties
    for (const f of ['properties.json', 'properties.txt', 'bot.properties']) {
      const c = await tryLoad(f);
      if (c !== null) { this.loadProperties(c); break; }
    }

    // Substitutions
    const subTypes: Array<['normal' | 'person' | 'person2' | 'gender' | 'denormal', string]> = [
      ['normal',   'normal'],
      ['person',   'person'],
      ['person2',  'person2'],
      ['gender',   'gender'],
      ['denormal', 'denormal'],
    ];
    for (const [type, fileName] of subTypes) {
      for (const ext of ['.json', '.txt']) {
        const c = await tryLoad(`substitutions/${fileName}${ext}`);
        if (c !== null) { this.loadSubstitutions(type, c); break; }
      }
    }

    // Sets
    for (const { name, content } of await tryLoadDir('sets')) {
      this.loadSet(name, content);
    }

    // Maps
    for (const { name, content } of await tryLoadDir('maps')) {
      this.loadMap(name, content);
    }

    // AIML files (non-recursive — standard AIML 2.0 layout is flat)
    await this.loadDirectory(dirPath, false, ['.aiml']);
  }

  /**
   * Programmatically add an AIML 2.0 category.
   *
   * AIML 2.0 wildcards (`#`, `^`) are supported in the pattern.
   *
   * @param pattern  AIML 2.0 input pattern.
   * @param template AIML 2.0 response template.
   * @param options  Optional `that` constraint.
   *
   * @example
   * bot.addCategory('# HELLO ^', 'Hello yourself!');
   * bot.addCategory('MY NAME IS *', 'Nice to meet you, <set name="name"><star/></set>!');
   */
  addCategory(
    pattern: string,
    template: string,
    options: { that?: string; topic?: string } = {},
  ): void {
    const thatPart = options.that ? `<that>${options.that}</that>` : '';
    const xml = `<aiml version="2.0"><category><pattern>${pattern}</pattern>${thatPart}<template>${template}</template></category></aiml>`;
    this.loadXMLString(xml).catch(() => {});
  }
}
