[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / Session

# Class: Session

Defined in: [core/Session.ts:33](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L33)

Represents a single user's conversation state.

A `Session` stores everything that makes one user's conversation distinct:
named predicates (variables), conversation history, the current topic,
and — for AIML 2.0 — a triple store for subject/predicate/object facts.

Sessions are created automatically by [AIMLBot.talk](AIMLBot.md#talk) when no
`sessionId` is supplied, or explicitly via [AIMLBot.createSession](AIMLBot.md#createsession).
They can be serialised to JSON and restored later to resume a conversation.

## Example

```ts
const bot = new AIML1Bot();
await bot.loadFile('alice.aiml');

// Start a named session
const session = bot.createSession('user-42');
session.setPredicate('name', 'Alice');

const { response } = await bot.talkSession('hello', session);

// Serialise and restore later
const saved = session.toJSON();
const restored = Session.fromJSON(saved);
```

## Constructors

### Constructor

> **new Session**(`id?`): `Session`

Defined in: [core/Session.ts:45](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L45)

#### Parameters

##### id?

`string`

Optional explicit session ID; a unique ID is generated if omitted.

#### Returns

`Session`

## Methods

### addTriple()

> **addTriple**(`subject`, `predicate`, `object`): `void`

Defined in: [core/Session.ts:194](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L194)

Add a subject/predicate/object triple.

Called by `<addtriple>` template tags.  Keys are lower-cased;
duplicate triples are silently ignored.

#### Parameters

##### subject

`string`

##### predicate

`string`

##### object

`string`

#### Returns

`void`

#### Example

```ts
session.addTriple('alice', 'likes', 'cats');
session.queryTriples('alice', 'likes'); // → [{ subject:'alice', predicate:'likes', object:'cats' }]
```

***

### addTurn()

> **addTurn**(`input`, `response`): `void`

Defined in: [core/Session.ts:123](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L123)

Append a completed conversation turn to the history.
Called automatically after each [AIMLBot.talk](AIMLBot.md#talk) call.

#### Parameters

##### input

`string`

##### response

`string`

#### Returns

`void`

***

### clearHistory()

> **clearHistory**(): `void`

Defined in: [core/Session.ts:178](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L178)

Clear all conversation history.

#### Returns

`void`

***

### deletePredicate()

> **deletePredicate**(`name`): `void`

Defined in: [core/Session.ts:85](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L85)

Delete a named predicate.

#### Parameters

##### name

`string`

Predicate name.

#### Returns

`void`

***

### deleteTriple()

> **deleteTriple**(`subject`, `predicate`, `object`): `void`

Defined in: [core/Session.ts:209](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L209)

Delete a specific triple.  Called by `<deletetriple>`.

#### Parameters

##### subject

`string`

##### predicate

`string`

##### object

`string`

#### Returns

`void`

***

### getAllPredicates()

> **getAllPredicates**(): `Record`\<`string`, `string`\>

Defined in: [core/Session.ts:93](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L93)

Return all predicates as a plain object snapshot.
Useful for debugging or serialisation.

#### Returns

`Record`\<`string`, `string`\>

***

### getHistory()

> **getHistory**(): [`ConversationTurn`](../interfaces/ConversationTurn.md)[]

Defined in: [core/Session.ts:173](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L173)

Return a copy of the full conversation history.

#### Returns

[`ConversationTurn`](../interfaces/ConversationTurn.md)[]

***

### getInput()

> **getInput**(`index?`): `string`

Defined in: [core/Session.ts:140](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L140)

Return the Nth previous user input (1-based, 1 = most recent).

Used by the `<input index="N"/>` template tag.

#### Parameters

##### index?

`number` = `1`

1-based index into history (1 = last input).

#### Returns

`string`

***

### getPredicate()

> **getPredicate**(`name`): `string`

Defined in: [core/Session.ts:61](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L61)

Read a named predicate value.

Predicate names are case-insensitive.  Returns `""` if the predicate
has not been set (matching AIML semantics for `<get name="..."/>`).

#### Parameters

##### name

`string`

Predicate name (case-insensitive).

#### Returns

`string`

***

### getResponse()

> **getResponse**(`index?`): `string`

Defined in: [core/Session.ts:152](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L152)

Return the Nth previous bot response (1-based, 1 = most recent).

Used by the `<response index="N"/>` template tag (AIML 2.0).

#### Parameters

##### index?

`number` = `1`

1-based index (1 = last response).

#### Returns

`string`

***

### getThat()

> **getThat**(`responseIndex?`, `sentenceIndex?`): `string`

Defined in: [core/Session.ts:165](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L165)

Return the Mth sentence of the Nth previous bot response.

Used by `<that index="N,M"/>`.  Sentences are split on `.`, `!`, `?`.

#### Parameters

##### responseIndex?

`number` = `1`

Response index (1 = most recent).

##### sentenceIndex?

`number` = `1`

Sentence index within that response (1 = first).

#### Returns

`string`

***

### getTopic()

> **getTopic**(): `string`

Defined in: [core/Session.ts:103](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L103)

Return the current conversation topic.

#### Returns

`string`

#### Default

```ts
"default"
```

***

### queryTriples()

> **queryTriples**(`subject?`, `predicate?`, `object?`): [`TripleEntry`](../interfaces/TripleEntry.md)[]

Defined in: [core/Session.ts:226](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L226)

Query the triple store.  Pass `undefined` to a field to act as a wildcard.

#### Parameters

##### subject?

`string`

Filter by subject (optional).

##### predicate?

`string`

Filter by predicate (optional).

##### object?

`string`

Filter by object (optional).

#### Returns

[`TripleEntry`](../interfaces/TripleEntry.md)[]

Matching triples.

***

### serialize()

> **serialize**(): [`SessionData`](../interfaces/SessionData.md)

Defined in: [core/Session.ts:247](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L247)

Serialise the session to a plain [SessionData](../interfaces/SessionData.md) object.

Pass the result to `JSON.stringify()` and store it.
Restore with [Session.deserialize](#deserialize).

#### Returns

[`SessionData`](../interfaces/SessionData.md)

***

### setPredicate()

> **setPredicate**(`name`, `value`): `void`

Defined in: [core/Session.ts:76](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L76)

Set a named predicate.

This is called automatically by `<set name="...">` template tags.
Setting `"topic"` also updates the session topic.

#### Parameters

##### name

`string`

Predicate name.

##### value

`string`

New value.

#### Returns

`void`

***

### setTopic()

> **setTopic**(`topic`): `void`

Defined in: [core/Session.ts:111](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L111)

Set the current conversation topic.
Also updates the `"topic"` predicate so `<get name="topic"/>` works.

#### Parameters

##### topic

`string`

#### Returns

`void`

***

### toJSON()

> **toJSON**(): `string`

Defined in: [core/Session.ts:288](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L288)

Serialise the session to a JSON string.

Use [Session.fromJSON](#fromjson) to restore.

#### Returns

`string`

#### Example

```ts
localStorage.setItem('session', session.toJSON());
```

***

### deserialize()

> `static` **deserialize**(`data`): `Session`

Defined in: [core/Session.ts:267](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L267)

Restore a session from a [SessionData](../interfaces/SessionData.md) object.

#### Parameters

##### data

[`SessionData`](../interfaces/SessionData.md)

#### Returns

`Session`

#### Example

```ts
const saved = session.serialize();
// … store saved somewhere …
const session2 = Session.deserialize(saved);
```

***

### fromJSON()

> `static` **fromJSON**(`json`): `Session`

Defined in: [core/Session.ts:298](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L298)

Restore a session from a JSON string produced by [Session.toJSON](#tojson).

#### Parameters

##### json

`string`

#### Returns

`Session`

#### Example

```ts
const session = Session.fromJSON(localStorage.getItem('session')!);
```

## Properties

### created

> `readonly` **created**: `number`

Defined in: [core/Session.ts:41](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L41)

Unix timestamp (ms) when the session was created.

***

### id

> `readonly` **id**: `string`

Defined in: [core/Session.ts:35](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Session.ts#L35)

Unique session identifier.
