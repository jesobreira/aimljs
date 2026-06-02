[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / AIMLBot

# Class: AIMLBot

Defined in: bots/AIMLBot.ts:101

Base class for all AIML bots.

`AIMLBot` provides the complete bot runtime: pattern matching, template
evaluation, session management, file loading, and serialisation.  The
two specialised subclasses ([AIML1Bot](AIML1Bot.md) and [AIML2Bot](AIML2Bot.md)) add
version-specific helpers but share this API.

---

### Quick-start (Node.js)

```ts
import { AIML1Bot } from 'aimljs';

const bot = new AIML1Bot({ properties: { name: 'Alice' } });
await bot.loadDirectory('./aiml');          // load all .aiml files

const { response } = await bot.talk('hello');
console.log(response); // "Hi there!"
```

### Quick-start (browser)

```ts
import { AIML1Bot } from 'aimljs';

const bot = new AIML1Bot();
// Pass File objects from <input type="file"> or pre-loaded content:
await bot.loadFile({ name: 'greetings.aiml', content: xmlString });

const { response, sessionId } = await bot.talk('hello');
```

### Session continuity

```ts
// First turn — a default session is created automatically
const r1 = await bot.talk('my name is Alice');

// Pass the sessionId back to continue the same conversation
const r2 = await bot.talk('what is my name', r1.sessionId);
console.log(r2.response); // "Your name is Alice."
```

## Extended by

- [`AIML1Bot`](AIML1Bot.md)
- [`AIML2Bot`](AIML2Bot.md)

## Accessors

### categoryCount

#### Get Signature

> **get** **categoryCount**(): `number`

Defined in: bots/AIMLBot.ts:444

Total number of loaded categories.

##### Returns

`number`

## Constructors

### Constructor

> **new AIMLBot**(`options?`): `AIMLBot`

Defined in: bots/AIMLBot.ts:127

#### Parameters

##### options?

[`AIMLBotOptions`](../interfaces/AIMLBotOptions.md) = `{}`

#### Returns

`AIMLBot`

## Methods

### addCategory()

> **addCategory**(`pattern`, `template`, `options?`): `void`

Defined in: bots/AIMLBot.ts:431

Programmatically add a single AIML category.

The pattern and template strings use AIML XML syntax (tags are allowed).

#### Parameters

##### pattern

`string`

AIML input pattern.

##### template

`string`

AIML response template.

##### options?

Optional `that` and `topic` constraints.

###### that?

`string`

###### topic?

`string`

#### Returns

`void`

#### Example

```ts
bot.addCategory('HELLO', 'Hi there!');
bot.addCategory('DO YOU LIKE *', 'I love <star/>!', { topic: 'ANIMALS' });
```

***

### addSubstitution()

> **addSubstitution**(`type`, `find`, `replace`): `void`

Defined in: bots/AIMLBot.ts:363

Append a single substitution rule to a table.

#### Parameters

##### type

`"normal"` \| `"person"` \| `"person2"` \| `"gender"` \| `"denormal"`

Which table to extend.

##### find

`string`

The text to find.

##### replace

`string`

The replacement.

#### Returns

`void`

#### Example

```ts
bot.addSubstitution('normal', "ain't", 'am not');
```

***

### createSession()

> **createSession**(`sessionId?`): [`Session`](Session.md)

Defined in: bots/AIMLBot.ts:464

Create a new session.

Sessions are created automatically by [talk](#talk), so you only need this
if you want to pre-configure a session (set predicates, topic, etc.).

#### Parameters

##### sessionId?

`string`

Optional explicit ID.  A unique ID is generated if omitted.

#### Returns

[`Session`](Session.md)

The new session.

#### Example

```ts
const session = bot.createSession('user-42');
session.setPredicate('name', 'Alice');
const { response } = await bot.talkSession('hello', session);
```

***

### deleteSession()

> **deleteSession**(`sessionId`): `boolean`

Defined in: bots/AIMLBot.ts:502

Delete a session and free its memory.

#### Parameters

##### sessionId

`string`

Session to delete.

#### Returns

`boolean`

`true` if the session existed and was deleted.

***

### getOrCreateSession()

> **getOrCreateSession**(`sessionId?`): [`Session`](Session.md)

Defined in: bots/AIMLBot.ts:489

Get an existing session or create one if it does not exist.

When `sessionId` is omitted a persistent default session (`__default__`)
is used for all calls without an ID.

#### Parameters

##### sessionId?

`string`

Optional session ID.

#### Returns

[`Session`](Session.md)

***

### getProperty()

> **getProperty**(`name`): `string`

Defined in: bots/AIMLBot.ts:305

Get a bot property value.

#### Parameters

##### name

`string`

Property name (case-insensitive).

#### Returns

`string`

The property value, or `""` if not set.

***

### getSession()

> **getSession**(`sessionId`): [`Session`](Session.md) \| `undefined`

Defined in: bots/AIMLBot.ts:477

Retrieve an existing session by ID.

#### Parameters

##### sessionId

`string`

The session ID to look up.

#### Returns

[`Session`](Session.md) \| `undefined`

The session, or `undefined` if not found.

***

### handleGossip()

> `protected` **handleGossip**(`_text`): `void`

Defined in: bots/AIMLBot.ts:705

Called whenever a `<gossip>` tag is encountered.
Override to log or store gossip messages.

#### Parameters

##### \_text

`string`

#### Returns

`void`

***

### handleNoMatch()

> `protected` **handleNoMatch**(`_input`, `_session`): `Promise`\<`string`\>

Defined in: bots/AIMLBot.ts:586

Called when no category matches the user's input.

Override in a subclass to provide a custom fallback response.
The default implementation returns `""`.

#### Parameters

##### \_input

`string`

##### \_session

[`Session`](Session.md)

#### Returns

`Promise`\<`string`\>

***

### loadAllSerializedSessions()

> **loadAllSerializedSessions**(`data`): `string`[]

Defined in: bots/AIMLBot.ts:669

Restore all sessions from a JSON string produced by [serializeAllSessions](#serializeallsessions).

#### Parameters

##### data

`string`

Serialised sessions JSON.

#### Returns

`string`[]

Array of restored session IDs.

***

### loadDirectory()

> **loadDirectory**(`dirPath`, `recursive?`, `extensions?`): `Promise`\<`void`\>

Defined in: bots/AIMLBot.ts:265

Recursively load all `.aiml` files from a directory.

**Node.js only.** Throws in browser environments.

#### Parameters

##### dirPath

`string`

Absolute or relative path to the directory.

##### recursive?

`boolean` = `true`

Whether to descend into subdirectories. Default `true`.

##### extensions?

`string`[] = `...`

File extensions to include. Default `['.aiml']`.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await bot.loadDirectory('./knowledge-base');
await bot.loadDirectory('./kb', true, ['.aiml', '.xml']);
```

***

### loadFile()

> **loadFile**(`source`): `Promise`\<`void`\>

Defined in: bots/AIMLBot.ts:227

Load a single AIML file from any [FileSource](../type-aliases/FileSource.md).

Works on both Node.js (string path) and in the browser (File object or
pre-loaded `{ name, content }` object).

#### Parameters

##### source

[`FileSource`](../type-aliases/FileSource.md)

The file to load.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
// Node.js
await bot.loadFile('/path/to/greetings.aiml');

// Browser (from <input type="file">)
const [file] = inputElement.files;
await bot.loadFile(file);

// Pre-loaded content (both platforms)
await bot.loadFile({ name: 'greeting.aiml', content: xmlString });
```

***

### loadFiles()

> **loadFiles**(`sources`): `Promise`\<`void`\>

Defined in: bots/AIMLBot.ts:246

Load multiple AIML files concurrently.

#### Parameters

##### sources

[`FileSource`](../type-aliases/FileSource.md)[]

Array of [FileSource](../type-aliases/FileSource.md) values.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await bot.loadFiles([
  '/path/to/greetings.aiml',
  '/path/to/personality.aiml',
  { name: 'custom.aiml', content: inlineXml },
]);
```

***

### loadMap()

> **loadMap**(`name`, `data`): `void`

Defined in: bots/AIMLBot.ts:404

Register a named map for use in `<map name="...">` template tags.

#### Parameters

##### name

`string`

Map name (case-insensitive).

##### data

`string` \| `Map`\<`string`, `string`\> \| `Record`\<`string`, `string`\>

Map content: plain object, `Map<string, string>`, JSON object, or `key:value` text.

#### Returns

`void`

#### Example

```ts
bot.loadMap('capitals', { france: 'Paris', japan: 'Tokyo' });
bot.loadMap('colors', 'red : #FF0000\ngreen : #00FF00');
bot.loadMap('scores', '{"alice":"100","bob":"200"}');
```

***

### loadProperties()

> **loadProperties**(`data`): `void`

Defined in: bots/AIMLBot.ts:322

Load bot properties from a text or JSON data source.

Accepts the same formats as [parseProperties](../functions/parseProperties.md):
- Plain object
- JSON string (`{ "key": "value" }`)
- Text file (`key:value` or `key=value`, one per line)

#### Parameters

##### data

`string` \| `Record`\<`string`, `string`\>

#### Returns

`void`

#### Example

```ts
bot.loadProperties('name:Alice\nversion:2.0');
bot.loadProperties({ name: 'Alice', version: '2.0' });
bot.loadProperties('{"name":"Alice"}');
```

***

### loadSerializedSession()

> **loadSerializedSession**(`data`): `string`

Defined in: bots/AIMLBot.ts:643

Restore a session from a JSON string produced by [serializeSession](#serializesession).

#### Parameters

##### data

`string`

Serialised session JSON.

#### Returns

`string`

The restored session's ID.

***

### loadSet()

> **loadSet**(`name`, `data`): `void`

Defined in: bots/AIMLBot.ts:387

Register a named set for use in pattern matching.

Sets enable patterns like `I LIKE <set>color</set>` to match any member
of the named set.

#### Parameters

##### name

`string`

Set name (case-insensitive).

##### data

`string` \| `string`[] \| `Set`\<`string`\>

Set content: string array, `Set<string>`, JSON array, or one-per-line text.

#### Returns

`void`

#### Example

```ts
bot.loadSet('color', ['red', 'green', 'blue']);
bot.loadSet('animal', 'cat\ndog\nbird');
bot.loadSet('fruit', '["apple","banana","cherry"]');
```

***

### loadSubstitutions()

> **loadSubstitutions**(`type`, `data`): `void`

Defined in: bots/AIMLBot.ts:345

Replace a substitution table entirely.

#### Parameters

##### type

`"normal"` \| `"person"` \| `"person2"` \| `"gender"` \| `"denormal"`

Which table to replace (`'normal'`, `'person'`, etc.).

##### data

`string` \| [`SubstitutionPair`](../interfaces/SubstitutionPair.md)[]

Text, JSON, or already-parsed pairs.

#### Returns

`void`

#### Example

```ts
// Load contractions from text
bot.loadSubstitutions('normal', "can't : cannot\nwon't : will not");
// Load from JSON array
bot.loadSubstitutions('person', '[{"find":"I","replace":"he or she"}]');
```

***

### loadXMLString()

> **loadXMLString**(`xml`, `fileName?`): `Promise`\<`void`\>

Defined in: bots/AIMLBot.ts:197

Parse and load an AIML XML string directly.

#### Parameters

##### xml

`string`

AIML XML content.

##### fileName?

`string`

Optional name shown in validation error messages.

#### Returns

`Promise`\<`void`\>

#### Throws

If the XML contains parse errors.

#### Example

```ts
await bot.loadXMLString(`
  <aiml version="1.0">
    <category>
      <pattern>HELLO</pattern>
      <template>Hi!</template>
    </category>
  </aiml>
`);
```

***

### serializeAllSessions()

> **serializeAllSessions**(): `string`

Defined in: bots/AIMLBot.ts:655

Serialise **all** active sessions to a single JSON string.

Useful for persisting a multi-user application's full state.
Restore with [loadAllSerializedSessions](#loadallserializedsessions).

#### Returns

`string`

***

### serializeSession()

> **serializeSession**(`sessionId`): `string`

Defined in: bots/AIMLBot.ts:631

Serialise a single session to a JSON string.

Store the result and pass it to [loadSerializedSession](#loadserializedsession) later to
resume the conversation.

#### Parameters

##### sessionId

`string`

The session to serialise.

#### Returns

`string`

#### Throws

If the session does not exist.

#### Example

```ts
const json = bot.serializeSession(sessionId);
localStorage.setItem('mySession', json);

// Later…
const saved = localStorage.getItem('mySession')!;
const id = bot.loadSerializedSession(saved);
const { response } = await bot.talk('hello again', id);
```

***

### setProperty()

> **setProperty**(`name`, `value`): `void`

Defined in: bots/AIMLBot.ts:293

Set a single bot property.

Bot properties are accessed in AIML templates via `<bot name="..."/>`.

#### Parameters

##### name

`string`

Property name (case-insensitive).

##### value

`string`

Property value.

#### Returns

`void`

#### Example

```ts
bot.setProperty('name', 'Alice');
// In AIML: <bot name="name"/> → "Alice"
```

***

### talk()

> **talk**(`input`, `sessionId?`): `Promise`\<[`TalkResult`](../interfaces/TalkResult.md)\>

Defined in: bots/AIMLBot.ts:532

Send a message to the bot and get a response.

If `sessionId` is omitted, a shared default session (`__default__`) is used
so that consecutive calls without a session ID maintain conversational state.

#### Parameters

##### input

`string`

The user's message.

##### sessionId?

`string`

Optional session ID.  Pass the `sessionId` from a previous
                 result to continue that conversation.

#### Returns

`Promise`\<[`TalkResult`](../interfaces/TalkResult.md)\>

An object with the bot's `response` and the `sessionId` used.

#### Example

```ts
const r1 = await bot.talk('my name is Alice');
// r1.sessionId is '__default__' (or whatever was used)

const r2 = await bot.talk('what is my name', r1.sessionId);
console.log(r2.response); // "Your name is Alice."

// Multi-user: pass explicit session IDs
await bot.talk('hello', 'user-1');
await bot.talk('hello', 'user-2');
```

***

### talkSession()

> **talkSession**(`input`, `session`): `Promise`\<`string`\>

Defined in: bots/AIMLBot.ts:547

Send a message using an explicit [Session](Session.md) object.

Useful when you manage sessions yourself rather than by ID.

#### Parameters

##### input

`string`

The user's message.

##### session

[`Session`](Session.md)

The session to use.

#### Returns

`Promise`\<`string`\>

The bot's response string.

***

### validateXML()

> **validateXML**(`xml`, `fileName?`): [`ValidationResult`](../interfaces/ValidationResult.md)

Defined in: bots/AIMLBot.ts:605

Validate an AIML XML string without loading it.

Returns a [ValidationResult](../interfaces/ValidationResult.md) with `valid`, `errors`, and `warnings`.

#### Parameters

##### xml

`string`

##### fileName?

`string`

#### Returns

[`ValidationResult`](../interfaces/ValidationResult.md)

#### Example

```ts
const result = bot.validateXML(xmlString, 'mybot.aiml');
if (!result.valid) {
  result.errors.forEach(e => console.error(e.message));
}
```
