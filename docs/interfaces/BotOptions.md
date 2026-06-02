[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / BotOptions

# Interface: BotOptions

Defined in: [types.ts:167](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L167)

Constructor options shared by all bot classes.

## Example

```ts
const bot = new AIML1Bot({
  properties: { name: 'Alice', age: '21' },
  maxRecursionDepth: 30,
  defaultTopic: 'general',
});
```

## Extended by

- [`AIMLBotOptions`](AIMLBotOptions.md)

## Properties

### defaultTopic?

> `optional` **defaultTopic?**: `string`

Defined in: [types.ts:192](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L192)

Default topic for new sessions.

#### Default

```ts
"default"
```

***

### locale?

> `optional` **locale?**: `string`

Defined in: [types.ts:194](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L194)

BCP-47 locale used for date formatting.

***

### maps?

> `optional` **maps?**: `Record`\<`string`, `Map`\<`string`, `string`\> \| `Record`\<`string`, `string`\>\>

Defined in: [types.ts:177](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L177)

Pre-load named maps (object, Map, or `key:value` text).

***

### maxLoopIterations?

> `optional` **maxLoopIterations?**: `number`

Defined in: [types.ts:187](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L187)

Maximum `<loop>` iterations inside a `<condition>`.

#### Default

```ts
1000
```

***

### maxRecursionDepth?

> `optional` **maxRecursionDepth?**: `number`

Defined in: [types.ts:182](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L182)

Maximum `<srai>` recursion depth before the bot gives up.

#### Default

```ts
50
```

***

### name?

> `optional` **name?**: `string`

Defined in: [types.ts:169](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L169)

Display name exposed via `<bot name="name"/>`.

***

### properties?

> `optional` **properties?**: [`BotProperties`](BotProperties.md)

Defined in: [types.ts:171](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L171)

Initial bot properties (see [BotProperties](BotProperties.md)).

***

### sets?

> `optional` **sets?**: `Record`\<`string`, `string`[] \| `Set`\<`string`\>\>

Defined in: [types.ts:175](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L175)

Pre-load named sets (string array, Set, or one-per-line text).

***

### substitutions?

> `optional` **substitutions?**: `Partial`\<[`Substitutions`](Substitutions.md)\>

Defined in: [types.ts:173](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L173)

Override any of the built-in substitution tables.

***

### timezone?

> `optional` **timezone?**: `string`

Defined in: [types.ts:196](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L196)

IANA timezone for date/time tags.
