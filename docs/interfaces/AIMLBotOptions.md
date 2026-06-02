[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / AIMLBotOptions

# Interface: AIMLBotOptions

Defined in: bots/AIMLBot.ts:35

Constructor options for [AIMLBot](../classes/AIMLBot.md) and its subclasses.

Extends [BotOptions](BotOptions.md) with runtime-only settings.

## Extends

- [`BotOptions`](BotOptions.md)

## Extended by

- [`AIML1BotOptions`](AIML1BotOptions.md)
- [`AIML2BotOptions`](AIML2BotOptions.md)

## Properties

### aimlVersion?

> `optional` **aimlVersion?**: `"1.0"` \| `"2.0"`

Defined in: bots/AIMLBot.ts:40

AIML dialect version to use when auto-detection fails.

#### Default

```ts
'1.0'
```

***

### defaultTopic?

> `optional` **defaultTopic?**: `string`

Defined in: types.ts:192

Default topic for new sessions.

#### Default

```ts
"default"
```

#### Inherited from

[`BotOptions`](BotOptions.md).[`defaultTopic`](BotOptions.md#defaulttopic)

***

### enableJavaScript?

> `optional` **enableJavaScript?**: `boolean`

Defined in: bots/AIMLBot.ts:51

Allow `<javascript>` tags to execute arbitrary JS via `new Function`.

#### Default

```ts
false (tag silently ignored when disabled)
```

***

### enableSystem?

> `optional` **enableSystem?**: `boolean`

Defined in: bots/AIMLBot.ts:46

Allow `<system>` tags to execute shell commands (Node.js only).
Disabled by default for security.

#### Default

```ts
false
```

***

### locale?

> `optional` **locale?**: `string`

Defined in: types.ts:194

BCP-47 locale used for date formatting.

#### Inherited from

[`BotOptions`](BotOptions.md).[`locale`](BotOptions.md#locale)

***

### maps?

> `optional` **maps?**: `Record`\<`string`, `Map`\<`string`, `string`\> \| `Record`\<`string`, `string`\>\>

Defined in: types.ts:177

Pre-load named maps (object, Map, or `key:value` text).

#### Inherited from

[`BotOptions`](BotOptions.md).[`maps`](BotOptions.md#maps)

***

### maxLoopIterations?

> `optional` **maxLoopIterations?**: `number`

Defined in: types.ts:187

Maximum `<loop>` iterations inside a `<condition>`.

#### Default

```ts
1000
```

#### Inherited from

[`BotOptions`](BotOptions.md).[`maxLoopIterations`](BotOptions.md#maxloopiterations)

***

### maxRecursionDepth?

> `optional` **maxRecursionDepth?**: `number`

Defined in: types.ts:182

Maximum `<srai>` recursion depth before the bot gives up.

#### Default

```ts
50
```

#### Inherited from

[`BotOptions`](BotOptions.md).[`maxRecursionDepth`](BotOptions.md#maxrecursiondepth)

***

### name?

> `optional` **name?**: `string`

Defined in: types.ts:169

Display name exposed via `<bot name="name"/>`.

#### Inherited from

[`BotOptions`](BotOptions.md).[`name`](BotOptions.md#name)

***

### properties?

> `optional` **properties?**: [`BotProperties`](BotProperties.md)

Defined in: types.ts:171

Initial bot properties (see [BotProperties](BotProperties.md)).

#### Inherited from

[`BotOptions`](BotOptions.md).[`properties`](BotOptions.md#properties)

***

### sets?

> `optional` **sets?**: `Record`\<`string`, `string`[] \| `Set`\<`string`\>\>

Defined in: types.ts:175

Pre-load named sets (string array, Set, or one-per-line text).

#### Inherited from

[`BotOptions`](BotOptions.md).[`sets`](BotOptions.md#sets)

***

### substitutions?

> `optional` **substitutions?**: `Partial`\<[`Substitutions`](Substitutions.md)\>

Defined in: types.ts:173

Override any of the built-in substitution tables.

#### Inherited from

[`BotOptions`](BotOptions.md).[`substitutions`](BotOptions.md#substitutions)

***

### timezone?

> `optional` **timezone?**: `string`

Defined in: types.ts:196

IANA timezone for date/time tags.

#### Inherited from

[`BotOptions`](BotOptions.md).[`timezone`](BotOptions.md#timezone)
