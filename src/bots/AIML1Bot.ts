/**
 * @module AIML1Bot
 * @category Bots
 */
import { AIMLBot, type AIMLBotOptions } from './AIMLBot';
import type { FileSource } from '../types';
import { loadFileSource } from '../loaders/FileLoader';

/**
 * Constructor options specific to {@link AIML1Bot}.
 */
export interface AIML1BotOptions extends AIMLBotOptions {
  /**
   * Path or content of a `.properties` file to load at construction time.
   * @example { name: '/path/to/bot.properties' }
   */
  propertiesFile?: FileSource;
  /**
   * Paths or content of substitution files, keyed by substitution type.
   */
  substitutionFiles?: {
    normal?: FileSource;
    person?: FileSource;
    person2?: FileSource;
    gender?: FileSource;
  };
  /**
   * A map of `setName → FileSource` for sets to load at construction time.
   */
  setFiles?: Record<string, FileSource>;
}

/**
 * AIML 1.0 bot.
 *
 * Extends {@link AIMLBot} with helpers tailored to the AIML 1.0 ecosystem:
 * - `.properties` text files (`key:value` or `key=value`)
 * - Substitution text files (`find : replace` per line)
 * - Set text files (one item per line)
 * - Standard AIML 1.0 directory layout auto-loader
 *
 * All AIML 1.0 template tags are supported:
 * `<star>`, `<srai>`, `<sr>`, `<set>`, `<get>`, `<bot>`, `<think>`,
 * `<condition>`, `<random>`, `<uppercase>`, `<lowercase>`, `<formal>`,
 * `<sentence>`, `<person>`, `<person2>`, `<gender>`, `<input>`, `<that>`,
 * `<thatstar>`, `<topicstar>`, `<learn>`, `<gossip>`, `<system>`,
 * `<javascript>`, `<date>`, `<version>`, `<size>`, `<id>`, `<br>`.
 *
 * ---
 *
 * ### Basic usage
 *
 * ```ts
 * import { AIML1Bot } from 'aimljs';
 *
 * const bot = new AIML1Bot({ properties: { name: 'Alice' } });
 * await bot.loadDirectory('./alice');
 *
 * const { response, sessionId } = await bot.talk('hello');
 * console.log(response); // "Hi there!"
 * ```
 *
 * ### Loading individual files
 *
 * ```ts
 * await bot.loadFile('/path/to/greetings.aiml');
 * await bot.loadPropertiesFile('/path/to/bot.properties');
 * await bot.loadSubstitutionFile('normal', '/path/to/normal.txt');
 * await bot.loadSetFile('color', '/path/to/colors.txt');
 * ```
 *
 * ### Standard directory layout (auto-loader)
 *
 * ```
 * /alice/
 *   *.aiml
 *   bot.properties          ← key:value
 *   normal.txt              ← substitutions
 *   person.txt
 *   person2.txt
 *   gender.txt
 *   sets/
 *     color.txt             ← one item per line
 *     animal.txt
 * ```
 *
 * ```ts
 * await bot.loadDataDirectory('/alice');
 * ```
 *
 * @category Bots
 */
export class AIML1Bot extends AIMLBot {
  constructor(options: AIML1BotOptions = {}) {
    super({ ...options, aimlVersion: '1.0' });
    this.botProperties.aiml_version = '1.0';
  }

  /**
   * Load a complete AIML 1.0 data directory using the standard layout.
   *
   * Automatically discovers and loads (in order):
   * 1. `bot.properties` / `properties.txt` / `properties`
   * 2. `normal.txt`, `person.txt`, `person2.txt`, `gender.txt`
   *    (also looks in `substitutions/` subdirectory)
   * 3. All `*.txt` files from a `sets/` subdirectory
   * 4. All `*.aiml` files (recursively)
   *
   * **Node.js only.**
   *
   * @param dirPath Absolute or relative path to the data directory.
   *
   * @example
   * ```ts
   * const bot = new AIML1Bot();
   * await bot.loadDataDirectory('./alice-aiml');
   * ```
   */
  async loadDataDirectory(dirPath: string): Promise<void> {
    if (typeof process === 'undefined') {
      throw new Error('loadDataDirectory is only available in Node.js');
    }
    const fs = await import('fs/promises');
    const path = await import('path');

    const tryLoad = async (relPath: string): Promise<string | null> => {
      const full = path.join(dirPath, relPath);
      try {
        return await fs.readFile(full, 'utf-8');
      } catch {
        return null;
      }
    };

    // Load properties
    for (const name of ['bot.properties', 'properties.txt', 'properties']) {
      const content = await tryLoad(name);
      if (content !== null) { this.loadProperties(content); break; }
    }

    // Load substitutions
    const subFiles: Record<string, string[]> = {
      normal:  ['normal.txt',  'normal.substitution',  'substitutions/normal.txt'],
      person:  ['person.txt',  'person.substitution',  'substitutions/person.txt'],
      person2: ['person2.txt', 'person2.substitution', 'substitutions/person2.txt'],
      gender:  ['gender.txt',  'gender.substitution',  'substitutions/gender.txt'],
    };

    for (const [type, candidates] of Object.entries(subFiles)) {
      for (const candidate of candidates) {
        const content = await tryLoad(candidate);
        if (content !== null) {
          this.loadSubstitutions(type as 'normal' | 'person' | 'person2' | 'gender', content);
          break;
        }
      }
    }

    // Load sets from sets/ subdirectory
    try {
      const setsDir = path.join(dirPath, 'sets');
      const entries = await fs.readdir(setsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === '.txt' || ext === '') {
          const setName = path.basename(entry.name, ext);
          const content = await fs.readFile(path.join(setsDir, entry.name), 'utf-8');
          this.loadSet(setName, content);
        }
      }
    } catch { /* no sets directory */ }

    // Load AIML files
    await this.loadDirectory(dirPath, true, ['.aiml']);
  }

  /**
   * Load bot properties from a file.
   *
   * The file may use `key:value`, `key=value`, or JSON `{ "key": "value" }` format.
   *
   * @param source A {@link FileSource} (path, File, or preloaded content).
   *
   * @example
   * await bot.loadPropertiesFile('/path/to/bot.properties');
   * await bot.loadPropertiesFile({ name: 'bot.properties', content: 'name:Alice' });
   */
  async loadPropertiesFile(source: FileSource): Promise<void> {
    const { content } = await loadFileSource(source);
    this.loadProperties(content);
  }

  /**
   * Load a substitution table from a file.
   *
   * The file uses `find : replace` text format (one rule per line).
   *
   * @param type   Which substitution table to replace (`'normal'`, `'person'`, etc.).
   * @param source A {@link FileSource}.
   *
   * @example
   * await bot.loadSubstitutionFile('normal', '/path/to/normal.txt');
   */
  async loadSubstitutionFile(
    type: 'normal' | 'person' | 'person2' | 'gender',
    source: FileSource,
  ): Promise<void> {
    const { content } = await loadFileSource(source);
    this.loadSubstitutions(type, content);
  }

  /**
   * Load a named set from a file (one item per line).
   *
   * @param name   Set name used in patterns (e.g. `color` for `<set>color</set>`).
   * @param source A {@link FileSource}.
   *
   * @example
   * await bot.loadSetFile('color', '/path/to/colors.txt');
   */
  async loadSetFile(name: string, source: FileSource): Promise<void> {
    const { content } = await loadFileSource(source);
    this.loadSet(name, content);
  }

  /**
   * Programmatically add an AIML 1.0 category.
   *
   * @param pattern  AIML input pattern.
   * @param template AIML response template (XML tags are allowed).
   * @param options  Optional `that` and `topic` constraints.
   *
   * @example
   * bot.addCategory('HELLO', 'Hi there!');
   * bot.addCategory('ARE YOU *', 'I am <star/>!', { topic: 'ROBOTS' });
   */
  addCategory(
    pattern: string,
    template: string,
    options: { that?: string; topic?: string } = {},
  ): void {
    const thatPart = options.that ? `<that>${options.that}</that>` : '';
    const topicEl = options.topic
      ? `<topic name="${options.topic}"><category><pattern>${pattern}</pattern>${thatPart}<template>${template}</template></category></topic>`
      : `<category><pattern>${pattern}</pattern>${thatPart}<template>${template}</template></category>`;

    const xml = `<aiml version="1.0">${topicEl}</aiml>`;
    this.loadXMLString(xml).catch(() => {});
  }
}
