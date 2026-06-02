[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / AIML1Bot

# Class: AIML1Bot

Defined in: [bots/AIML1Bot.ts:93](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIML1Bot.ts#L93)

AIML 1.0 bot.

Extends [AIMLBot](AIMLBot.md) with helpers tailored to the AIML 1.0 ecosystem:
- `.properties` text files (`key:value` or `key=value`)
- Substitution text files (`find : replace` per line)
- Set text files (one item per line)
- Standard AIML 1.0 directory layout auto-loader

All AIML 1.0 template tags are supported:
`<star>`, `<srai>`, `<sr>`, `<set>`, `<get>`, `<bot>`, `<think>`,
`<condition>`, `<random>`, `<uppercase>`, `<lowercase>`, `<formal>`,
`<sentence>`, `<person>`, `<person2>`, `<gender>`, `<input>`, `<that>`,
`<thatstar>`, `<topicstar>`, `<learn>`, `<gossip>`, `<system>`,
`<javascript>`, `<date>`, `<version>`, `<size>`, `<id>`, `<br>`.

---

### Basic usage

```ts
import { AIML1Bot } from 'aiml.js';

const bot = new AIML1Bot({ properties: { name: 'Alice' } });
await bot.loadDirectory('./alice');

const { response, sessionId } = await bot.talk('hello');
console.log(response); // "Hi there!"
```

### Loading individual files

```ts
await bot.loadFile('/path/to/greetings.aiml');
await bot.loadPropertiesFile('/path/to/bot.properties');
await bot.loadSubstitutionFile('normal', '/path/to/normal.txt');
await bot.loadSetFile('color', '/path/to/colors.txt');
```

### Standard directory layout (auto-loader)

```
/alice/
  *.aiml
  bot.properties          ← key:value
  normal.txt              ← substitutions
  person.txt
  person2.txt
  gender.txt
  sets/
    color.txt             ← one item per line
    animal.txt
```

```ts
await bot.loadDataDirectory('/alice');
```

## Extends

- [`AIMLBot`](AIMLBot.md)

## Accessors

### categoryCount

#### Get Signature

> **get** **categoryCount**(): `number`

Defined in: [bots/AIMLBot.ts:444](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L444)

Total number of loaded categories.

##### Returns

`number`

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`categoryCount`](AIMLBot.md#categorycount)

## Constructors

### Constructor

> **new AIML1Bot**(`options?`): `AIML1Bot`

Defined in: [bots/AIML1Bot.ts:94](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIML1Bot.ts#L94)

#### Parameters

##### options?

[`AIML1BotOptions`](../interfaces/AIML1BotOptions.md) = `{}`

#### Returns

`AIML1Bot`

#### Overrides

[`AIMLBot`](AIMLBot.md).[`constructor`](AIMLBot.md#constructor)

## Methods

### addCategory()

> **addCategory**(`pattern`, `template`, `options?`): `void`

Defined in: [bots/AIML1Bot.ts:238](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIML1Bot.ts#L238)

Programmatically add an AIML 1.0 category.

#### Parameters

##### pattern

`string`

AIML input pattern.

##### template

`string`

AIML response template (XML tags are allowed).

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
bot.addCategory('ARE YOU *', 'I am <star/>!', { topic: 'ROBOTS' });
```

#### Overrides

[`AIMLBot`](AIMLBot.md).[`addCategory`](AIMLBot.md#addcategory)

***

### addSubstitution()

> **addSubstitution**(`type`, `find`, `replace`): `void`

Defined in: [bots/AIMLBot.ts:363](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L363)

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

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`addSubstitution`](AIMLBot.md#addsubstitution)

***

### createSession()

> **createSession**(`sessionId?`): [`Session`](Session.md)

Defined in: [bots/AIMLBot.ts:464](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L464)

Create a new session.

Sessions are created automatically by [talk](AIMLBot.md#talk), so you only need this
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

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`createSession`](AIMLBot.md#createsession)

***

### deleteSession()

> **deleteSession**(`sessionId`): `boolean`

Defined in: [bots/AIMLBot.ts:502](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L502)

Delete a session and free its memory.

#### Parameters

##### sessionId

`string`

Session to delete.

#### Returns

`boolean`

`true` if the session existed and was deleted.

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`deleteSession`](AIMLBot.md#deletesession)

***

### getOrCreateSession()

> **getOrCreateSession**(`sessionId?`): [`Session`](Session.md)

Defined in: [bots/AIMLBot.ts:489](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L489)

Get an existing session or create one if it does not exist.

When `sessionId` is omitted a persistent default session (`__default__`)
is used for all calls without an ID.

#### Parameters

##### sessionId?

`string`

Optional session ID.

#### Returns

[`Session`](Session.md)

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`getOrCreateSession`](AIMLBot.md#getorcreatesession)

***

### getProperty()

> **getProperty**(`name`): `string`

Defined in: [bots/AIMLBot.ts:305](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L305)

Get a bot property value.

#### Parameters

##### name

`string`

Property name (case-insensitive).

#### Returns

`string`

The property value, or `""` if not set.

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`getProperty`](AIMLBot.md#getproperty)

***

### getSession()

> **getSession**(`sessionId`): [`Session`](Session.md) \| `undefined`

Defined in: [bots/AIMLBot.ts:477](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L477)

Retrieve an existing session by ID.

#### Parameters

##### sessionId

`string`

The session ID to look up.

#### Returns

[`Session`](Session.md) \| `undefined`

The session, or `undefined` if not found.

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`getSession`](AIMLBot.md#getsession)

***

### handleGossip()

> `protected` **handleGossip**(`_text`): `void`

Defined in: [bots/AIMLBot.ts:705](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L705)

Called whenever a `<gossip>` tag is encountered.
Override to log or store gossip messages.

#### Parameters

##### \_text

`string`

#### Returns

`void`

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`handleGossip`](AIMLBot.md#handlegossip)

***

### handleNoMatch()

> `protected` **handleNoMatch**(`_input`, `_session`): `Promise`\<`string`\>

Defined in: [bots/AIMLBot.ts:586](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L586)

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

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`handleNoMatch`](AIMLBot.md#handlenomatch)

***

### loadAllSerializedSessions()

> **loadAllSerializedSessions**(`data`): `string`[]

Defined in: [bots/AIMLBot.ts:669](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L669)

Restore all sessions from a JSON string produced by [serializeAllSessions](AIMLBot.md#serializeallsessions).

#### Parameters

##### data

`string`

Serialised sessions JSON.

#### Returns

`string`[]

Array of restored session IDs.

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`loadAllSerializedSessions`](AIMLBot.md#loadallserializedsessions)

***

### loadDataDirectory()

> **loadDataDirectory**(`dirPath`): `Promise`\<`void`\>

Defined in: [bots/AIML1Bot.ts:119](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIML1Bot.ts#L119)

Load a complete AIML 1.0 data directory using the standard layout.

Automatically discovers and loads (in order):
1. `bot.properties` / `properties.txt` / `properties`
2. `normal.txt`, `person.txt`, `person2.txt`, `gender.txt`
   (also looks in `substitutions/` subdirectory)
3. All `*.txt` files from a `sets/` subdirectory
4. All `*.aiml` files (recursively)

**Node.js only.**

#### Parameters

##### dirPath

`string`

Absolute or relative path to the data directory.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
const bot = new AIML1Bot();
await bot.loadDataDirectory('./alice-aiml');
```

***

### loadDirectory()

> **loadDirectory**(`dirPath`, `recursive?`, `extensions?`): `Promise`\<`void`\>

Defined in: [bots/AIMLBot.ts:265](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L265)

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

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`loadDirectory`](AIMLBot.md#loaddirectory)

***

### loadFile()

> **loadFile**(`source`): `Promise`\<`void`\>

Defined in: [bots/AIMLBot.ts:227](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L227)

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

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`loadFile`](AIMLBot.md#loadfile)

***

### loadFiles()

> **loadFiles**(`sources`): `Promise`\<`void`\>

Defined in: [bots/AIMLBot.ts:246](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L246)

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

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`loadFiles`](AIMLBot.md#loadfiles)

***

### loadMap()

> **loadMap**(`name`, `data`): `void`

Defined in: [bots/AIMLBot.ts:404](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L404)

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

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`loadMap`](AIMLBot.md#loadmap)

***

### loadProperties()

> **loadProperties**(`data`): `void`

Defined in: [bots/AIMLBot.ts:322](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L322)

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

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`loadProperties`](AIMLBot.md#loadproperties)

***

### loadPropertiesFile()

> **loadPropertiesFile**(`source`): `Promise`\<`void`\>

Defined in: [bots/AIML1Bot.ts:189](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIML1Bot.ts#L189)

Load bot properties from a file.

The file may use `key:value`, `key=value`, or JSON `{ "key": "value" }` format.

#### Parameters

##### source

[`FileSource`](../type-aliases/FileSource.md)

A [FileSource](../type-aliases/FileSource.md) (path, File, or preloaded content).

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await bot.loadPropertiesFile('/path/to/bot.properties');
await bot.loadPropertiesFile({ name: 'bot.properties', content: 'name:Alice' });
```

***

### loadSerializedSession()

> **loadSerializedSession**(`data`): `string`

Defined in: [bots/AIMLBot.ts:643](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L643)

Restore a session from a JSON string produced by [serializeSession](AIMLBot.md#serializesession).

#### Parameters

##### data

`string`

Serialised session JSON.

#### Returns

`string`

The restored session's ID.

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`loadSerializedSession`](AIMLBot.md#loadserializedsession)

***

### loadSet()

> **loadSet**(`name`, `data`): `void`

Defined in: [bots/AIMLBot.ts:387](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L387)

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

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`loadSet`](AIMLBot.md#loadset)

***

### loadSetFile()

> **loadSetFile**(`name`, `source`): `Promise`\<`void`\>

Defined in: [bots/AIML1Bot.ts:222](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIML1Bot.ts#L222)

Load a named set from a file (one item per line).

#### Parameters

##### name

`string`

Set name used in patterns (e.g. `color` for `<set>color</set>`).

##### source

[`FileSource`](../type-aliases/FileSource.md)

A [FileSource](../type-aliases/FileSource.md).

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await bot.loadSetFile('color', '/path/to/colors.txt');
```

***

### loadSubstitutionFile()

> **loadSubstitutionFile**(`type`, `source`): `Promise`\<`void`\>

Defined in: [bots/AIML1Bot.ts:205](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIML1Bot.ts#L205)

Load a substitution table from a file.

The file uses `find : replace` text format (one rule per line).

#### Parameters

##### type

`"normal"` \| `"person"` \| `"person2"` \| `"gender"`

Which substitution table to replace (`'normal'`, `'person'`, etc.).

##### source

[`FileSource`](../type-aliases/FileSource.md)

A [FileSource](../type-aliases/FileSource.md).

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await bot.loadSubstitutionFile('normal', '/path/to/normal.txt');
```

***

### loadSubstitutions()

> **loadSubstitutions**(`type`, `data`): `void`

Defined in: [bots/AIMLBot.ts:345](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L345)

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

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`loadSubstitutions`](AIMLBot.md#loadsubstitutions)

***

### loadXMLString()

> **loadXMLString**(`xml`, `fileName?`): `Promise`\<`void`\>

Defined in: [bots/AIMLBot.ts:197](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L197)

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

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`loadXMLString`](AIMLBot.md#loadxmlstring)

***

### serializeAllSessions()

> **serializeAllSessions**(): `string`

Defined in: [bots/AIMLBot.ts:655](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L655)

Serialise **all** active sessions to a single JSON string.

Useful for persisting a multi-user application's full state.
Restore with [loadAllSerializedSessions](AIMLBot.md#loadallserializedsessions).

#### Returns

`string`

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`serializeAllSessions`](AIMLBot.md#serializeallsessions)

***

### serializeSession()

> **serializeSession**(`sessionId`): `string`

Defined in: [bots/AIMLBot.ts:631](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L631)

Serialise a single session to a JSON string.

Store the result and pass it to [loadSerializedSession](AIMLBot.md#loadserializedsession) later to
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

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`serializeSession`](AIMLBot.md#serializesession)

***

### setProperty()

> **setProperty**(`name`, `value`): `void`

Defined in: [bots/AIMLBot.ts:293](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L293)

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

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`setProperty`](AIMLBot.md#setproperty)

***

### talk()

> **talk**(`input`, `sessionId?`): `Promise`\<[`TalkResult`](../interfaces/TalkResult.md)\>

Defined in: [bots/AIMLBot.ts:532](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L532)

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

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`talk`](AIMLBot.md#talk)

***

### talkSession()

> **talkSession**(`input`, `session`): `Promise`\<`string`\>

Defined in: [bots/AIMLBot.ts:547](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L547)

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

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`talkSession`](AIMLBot.md#talksession)

***

### validateXML()

> **validateXML**(`xml`, `fileName?`): [`ValidationResult`](../interfaces/ValidationResult.md)

Defined in: [bots/AIMLBot.ts:605](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L605)

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

#### Inherited from

[`AIMLBot`](AIMLBot.md).[`validateXML`](AIMLBot.md#validatexml)
