[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / BotOptions

# Interface: BotOptions

Defined in: types.ts:167

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

Defined in: types.ts:192

Default topic for new sessions.

#### Default

```ts
"default"
```

***

### locale?

> `optional` **locale?**: `string`

Defined in: types.ts:194

BCP-47 locale used for date formatting.

***

### maps?

> `optional` **maps?**: `Record`\<`string`, `Map`\<`string`, `string`\> \| `Record`\<`string`, `string`\>\>

Defined in: types.ts:177

Pre-load named maps (object, Map, or `key:value` text).

***

### maxLoopIterations?

> `optional` **maxLoopIterations?**: `number`

Defined in: types.ts:187

Maximum `<loop>` iterations inside a `<condition>`.

#### Default

```ts
1000
```

***

### maxRecursionDepth?

> `optional` **maxRecursionDepth?**: `number`

Defined in: types.ts:182

Maximum `<srai>` recursion depth before the bot gives up.

#### Default

```ts
50
```

***

### name?

> `optional` **name?**: `string`

Defined in: types.ts:169

Display name exposed via `<bot name="name"/>`.

***

### properties?

> `optional` **properties?**: [`BotProperties`](BotProperties.md)

Defined in: types.ts:171

Initial bot properties (see [BotProperties](BotProperties.md)).

***

### sets?

> `optional` **sets?**: `Record`\<`string`, `string`[] \| `Set`\<`string`\>\>

Defined in: types.ts:175

Pre-load named sets (string array, Set, or one-per-line text).

***

### substitutions?

> `optional` **substitutions?**: `Partial`\<[`Substitutions`](Substitutions.md)\>

Defined in: types.ts:173

Override any of the built-in substitution tables.

***

### timezone?

> `optional` **timezone?**: `string`

Defined in: types.ts:196

IANA timezone for date/time tags.
