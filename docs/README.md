**aimljs v1.0.0**

***

# aimljs

A full-featured TypeScript library for parsing, validating, and running **AIML (Artificial Intelligence Markup Language)** bots on both Node.js and in the browser.

## Features

- **AIML 1.0 and 2.0** support — separate `AIML1Bot` / `AIML2Bot` classes with identical APIs
- **Full tag coverage** — all standard template tags for both versions
- **Isomorphic** — runs in Node.js ≥ 18 and modern browsers (ESM + CJS builds)
- **File loading** — directory scan (Node.js), `File` API (browser), or inline strings (both)
- **Data files** — properties, substitutions, sets, and maps in text *or* JSON, auto-detected
- **Session management** — per-user predicates, history, topics, and AIML 2.0 triple store
- **Serialisation** — freeze a session to JSON, restore it later to resume the conversation
- **Validation API** — check AIML XML for errors without loading it into a bot
- **`aiml-validate` CLI** — validate files from the command line or CI

---

## Installation

```bash
npm install aimljs
```

---

## npm scripts

| Command                        | Description                                       |
| ------------------------------ | ------------------------------------------------- |
| `npm run build`              | Compile library + CLI to `dist/`                |
| `npm test`                   | Run Jest test suite                               |
| `npm run test:coverage`      | Tests with coverage report                        |
| `npm run docs`               | Generate Markdown API docs in `docs/`           |
| `npm run typecheck`          | TypeScript type check (no emit)                   |
| `npm run validate -- <path>` | Run `aiml-validate` on a file or directory      |
| `npm run chat:freeaiml`      | Interactive terminal chat with Free-AIML bot      |
| `npm run chat:rosie`         | Interactive terminal chat with Rosie AIML 2.0 bot |
| `npm run app`                | Start the web chat app at http://localhost:3000   |

---

## aiml-validate CLI

Validate AIML files from the command line.

### Run without installing (npx)

```bash
npx aimljs aiml-validate mybot.aiml
npx aimljs aiml-validate -r ./knowledge-base
```

### Install globally

```bash
npm install -g aimljs
aiml-validate --help
```

### Usage

```
aiml-validate [options] <file|directory> [...]

Options:
  -r, --recursive    Recurse into subdirectories
  -s, --stats        Show per-file category count and parse time
  -q, --quiet        Only print errors (suppress warnings and stats)
  --json             Output results as JSON (useful for CI pipelines)
  -v, --version      Show version
  -h, --help         Show help
```

### Examples

```bash
# Validate a single file
aiml-validate greetings.aiml

# Validate all .aiml files in a folder
aiml-validate ./alice/

# Recursive scan with per-file stats
aiml-validate -r --stats ./knowledge-base/

# CI-friendly JSON output — exits 1 on errors
aiml-validate --json -r ./aiml/ > report.json
```

### Sample output

```
✓ greetings.aiml  (42 categories, 8ms)
✓ personality.aiml (318 categories, 22ms)
✗ broken.aiml
  ✗ error   <category> missing <template> [category]

Results: 3 files checked
  360 categories loaded
  2 valid
  1 with errors (1 total)
```

---

## Web Chat App

A local Express.js web app with a **ChatGPT-like interface** that combines the [Rosie AIML 2.0 bot](https://github.com/pandorabots/rosie) and the [Free-AIML collection](https://github.com/pandorabots/Free-AIML) (credits: [Pandora Bots](https://github.com/pandorabots)) into a single bot named Alice.

```bash
npm run app
# → http://localhost:3000
```

Features:

- ChatGPT-style UI fully working example app
- Multiple named sessions: switch between conversations in the sidebar
- Fully responsive (mobile-friendly sidebar)
- Custom port: `PORT=4000 npm run app`

---

## Quick start

### Node.js

```ts
import { AIML1Bot } from 'aimljs';

const bot = new AIML1Bot({ properties: { name: 'Alice' } });
await bot.loadDirectory('./aiml');          // load all *.aiml files

const { response, sessionId } = await bot.talk('hello');
console.log(response); // "Hi there!"

// Continue the same conversation with the session ID
const r2 = await bot.talk('my name is Bob', sessionId);
const r3 = await bot.talk('what is my name', sessionId);
console.log(r3.response); // "Your name is Bob."
```

### Browser (with a bundler)

```ts
import { AIML1Bot } from 'aimljs';

const bot = new AIML1Bot();

// From a <input type="file"> element
const [file] = inputEl.files;
await bot.loadFile(file);

// Or from a pre-loaded string
await bot.loadFile({ name: 'greetings.aiml', content: xmlString });

const { response } = await bot.talk('hello');
```

---

## AIML 1.0

```ts
import { AIML1Bot } from 'aimljs';

const bot = new AIML1Bot({
  properties: { name: 'Alice', version: '1.0' },
  defaultTopic: 'general',
});

// All-in-one directory loader (finds bot.properties, normal.txt, sets/, *.aiml)
await bot.loadDataDirectory('./alice');

// Or load each piece individually
await bot.loadPropertiesFile('./alice/bot.properties');
await bot.loadSubstitutionFile('normal', './alice/normal.txt');
await bot.loadSetFile('color', './alice/sets/colors.txt');
await bot.loadDirectory('./alice/aiml');
```

### Supported AIML 1.0 tags

`<star>`, `<srai>`, `<sr>`, `<set>`, `<get>`, `<bot>`, `<think>`,
`<condition>` (all 3 forms), `<random>`, `<uppercase>`, `<lowercase>`,
`<formal>`, `<sentence>`, `<person>`, `<person2>`, `<gender>`, `<input>`,
`<that>`, `<thatstar>`, `<topicstar>`, `<learn>`, `<gossip>`,
`<system>` (opt-in), `<javascript>` (opt-in), `<date>`, `<version>`,
`<size>`, `<id>`, `<br>`.

---

## AIML 2.0

```ts
import { AIML2Bot } from 'aimljs';

const bot = new AIML2Bot({
  properties: { name: 'Rosie' },
  maps:  { capitals: { france: 'Paris', japan: 'Tokyo' } },
  sets:  { color: ['red', 'green', 'blue'] },
  sraixHandler: async (service, input) => fetchExternalService(service, input),
  maxRecursionDepth: 200,
});

// All-in-one loader (properties.json, substitutions/, sets/, maps/, *.aiml)
await bot.loadDataDirectory('./rosie');
```

### Additional AIML 2.0 features

| Tag / feature                                    | Description                                          |
| ------------------------------------------------ | ---------------------------------------------------- |
| `#` wildcard                                   | Zero or more words (highest priority)                |
| `^` wildcard                                   | Zero or more words (lower than `*`)                |
| `<sraix>`                                      | Call external services                               |
| `<map name="...">` / `<map><name>...</name>` | Named map lookups (both attribute and element forms) |
| `<normalize>` / `<denormalize>`              | Substitution transforms                              |
| `<explode>`                                    | Space-separate every character                       |
| `<first>` / `<rest>`                         | First / remaining words                              |
| `<request>` / `<response>`                   | History access                                       |
| `<learn>` / `<learnf>`                       | Teach the bot at runtime                             |
| `<loop/>`                                      | Loop a `<condition>` branch                        |
| `<addtriple>` / `<deletetriple>`             | Manage RDF-style facts                               |
| `<select>` / `<uniq>`                        | Query the fact store                                 |
| `<condition>` with `<var>` element           | AIML 2.0 child-element condition form                |
| Sets / maps in JSON                              | `["item"]` / `{"key":"value"}`                   |

---

## Session management

```ts
// Conversations are isolated by session ID
const r1 = await bot.talk('my name is Alice', 'user-42');
const r2 = await bot.talk('what is my name', 'user-42');
// r2.response → "Your name is Alice."

// Unset predicates return "unknown" (Pandorabots convention)
// Conditions in AIML check value="unknown" for unset predicates

// Serialise — persist to DB, file, or localStorage
const json = bot.serializeSession('user-42');

// Restore in a different process / after restart
const bot2 = new AIML1Bot(/* same options */);
await bot2.loadDirectory('./aiml');
const id = bot2.loadSerializedSession(json);

// Save / restore all sessions at once
const allJson = bot.serializeAllSessions();
bot2.loadAllSerializedSessions(allJson);
```

---

## Loading data (text and JSON)

All loaders auto-detect format.

### Properties

```ts
bot.loadProperties('name:Alice\nversion:1.0');          // text
bot.loadProperties({ name: 'Alice', version: '1.0' });  // object
bot.loadProperties('{"name":"Alice"}');                  // JSON
// Pandorabots array-of-arrays format also supported:
bot.loadProperties('[["name","Alice"],["version","1.0"]]');
```

### Substitutions

```ts
bot.loadSubstitutions('normal', "can't : cannot\nwon't : will not");   // text
bot.loadSubstitutions('normal', '[{"find":"cant","replace":"cannot"}]'); // JSON array
bot.loadSubstitutions('person', '[["I am","he or she is"]]');            // array-of-arrays
```

### Sets

```ts
bot.loadSet('color', ['red', 'green', 'blue']);  // array
bot.loadSet('animal', 'cat\ndog\nbird');          // text
bot.loadSet('fruit', '["apple","banana"]');       // JSON
bot.loadSet('name', '[["Alice"],["Bob"]]');        // Pandorabots array-of-arrays
```

### Maps

```ts
bot.loadMap('capitals', { france: 'Paris', japan: 'Tokyo' });  // object
bot.loadMap('size', 'small : 1\nmedium : 2');                  // text
bot.loadMap('scores', '{"alice":"100"}');                       // JSON
bot.loadMap('nation2capital', '[["France","Paris"]]');          // array-of-arrays
```

---

## Programmatic categories

```ts
bot.addCategory('HELLO', 'Hi there!');
bot.addCategory('DO YOU LIKE *', 'I love <star/>!', { topic: 'ANIMALS' });
bot.addCategory('ARE YOU *', '<srai>HELLO</srai>', { that: 'HI THERE' });
```

---

## Validation

```ts
import { validateAIML } from 'aimljs';

const result = validateAIML(xmlString, 'mybot.aiml');
if (!result.valid) {
  for (const err of result.errors) {
    console.error(`${err.file}: ${err.message}`);
  }
}
```

---

## Pattern priority

| Priority | AIML 1.0       | AIML 2.0           |
| -------- | -------------- | ------------------ |
| Highest  | `_` wildcard | `#` wildcard     |
| High     | Exact words    | `_` wildcard     |
| Medium   | -              | Exact words / sets |
| Low      | -              | `^` wildcard     |
| Lowest   | `*` wildcard | `*` wildcard     |

Priority applies independently to input, `<that>`, and `<topic>` patterns.
Categories without a `<topic>` element default to `topic="*"` (match any topic).

---

## API reference

Generate the full Markdown docs locally:

```bash
npm run docs
# → docs/
```

---

## Examples

| File                                                                            | Description                                                       |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [`examples/01-basic-aiml1.ts`](_media/01-basic-aiml1.ts)                     | Basic AIML 1.0 — predicates, srai, topics, random, serialisation |
| [`examples/02-aiml2-features.ts`](_media/02-aiml2-features.ts)               | AIML 2.0 — wildcards, maps, triples, sraix, learn                |
| [`examples/03-session-management.ts`](_media/03-session-management.ts)       | Multi-user sessions and serialisation                             |
| [`examples/04-validation-and-parser.ts`](_media/04-validation-and-parser.ts) | Validation and low-level parser / PatternMatcher API              |
| [`examples/05-browser-usage.ts`](_media/05-browser-usage.ts)                 | Browser patterns (fetch, File API, localStorage)                  |

Run an example:

```bash
npx tsx examples/01-basic-aiml1.ts
```

---

## License

MIT
