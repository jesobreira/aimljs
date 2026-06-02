[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / AIML1BotOptions

# Interface: AIML1BotOptions

Defined in: bots/AIML1Bot.ts:12

Constructor options specific to [AIML1Bot](../classes/AIML1Bot.md).

## Extends

- [`AIMLBotOptions`](AIMLBotOptions.md)

## Properties

### aimlVersion?

> `optional` **aimlVersion?**: `"1.0"` \| `"2.0"`

Defined in: bots/AIMLBot.ts:40

AIML dialect version to use when auto-detection fails.

#### Default

```ts
'1.0'
```

#### Inherited from

[`AIMLBotOptions`](AIMLBotOptions.md).[`aimlVersion`](AIMLBotOptions.md#aimlversion)

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

[`AIMLBotOptions`](AIMLBotOptions.md).[`defaultTopic`](AIMLBotOptions.md#defaulttopic)

***

### enableJavaScript?

> `optional` **enableJavaScript?**: `boolean`

Defined in: bots/AIMLBot.ts:51

Allow `<javascript>` tags to execute arbitrary JS via `new Function`.

#### Default

```ts
false (tag silently ignored when disabled)
```

#### Inherited from

[`AIMLBotOptions`](AIMLBotOptions.md).[`enableJavaScript`](AIMLBotOptions.md#enablejavascript)

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

#### Inherited from

[`AIMLBotOptions`](AIMLBotOptions.md).[`enableSystem`](AIMLBotOptions.md#enablesystem)

***

### locale?

> `optional` **locale?**: `string`

Defined in: types.ts:194

BCP-47 locale used for date formatting.

#### Inherited from

[`AIMLBotOptions`](AIMLBotOptions.md).[`locale`](AIMLBotOptions.md#locale)

***

### maps?

> `optional` **maps?**: `Record`\<`string`, `Map`\<`string`, `string`\> \| `Record`\<`string`, `string`\>\>

Defined in: types.ts:177

Pre-load named maps (object, Map, or `key:value` text).

#### Inherited from

[`AIMLBotOptions`](AIMLBotOptions.md).[`maps`](AIMLBotOptions.md#maps)

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

[`AIMLBotOptions`](AIMLBotOptions.md).[`maxLoopIterations`](AIMLBotOptions.md#maxloopiterations)

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

[`AIMLBotOptions`](AIMLBotOptions.md).[`maxRecursionDepth`](AIMLBotOptions.md#maxrecursiondepth)

***

### name?

> `optional` **name?**: `string`

Defined in: types.ts:169

Display name exposed via `<bot name="name"/>`.

#### Inherited from

[`AIMLBotOptions`](AIMLBotOptions.md).[`name`](AIMLBotOptions.md#name)

***

### properties?

> `optional` **properties?**: [`BotProperties`](BotProperties.md)

Defined in: types.ts:171

Initial bot properties (see [BotProperties](BotProperties.md)).

#### Inherited from

[`AIMLBotOptions`](AIMLBotOptions.md).[`properties`](AIMLBotOptions.md#properties)

***

### propertiesFile?

> `optional` **propertiesFile?**: [`FileSource`](../type-aliases/FileSource.md)

Defined in: bots/AIML1Bot.ts:17

Path or content of a `.properties` file to load at construction time.

#### Example

```ts
{ name: '/path/to/bot.properties' }
```

***

### setFiles?

> `optional` **setFiles?**: `Record`\<`string`, [`FileSource`](../type-aliases/FileSource.md)\>

Defined in: bots/AIML1Bot.ts:30

A map of `setName → FileSource` for sets to load at construction time.

***

### sets?

> `optional` **sets?**: `Record`\<`string`, `string`[] \| `Set`\<`string`\>\>

Defined in: types.ts:175

Pre-load named sets (string array, Set, or one-per-line text).

#### Inherited from

[`AIMLBotOptions`](AIMLBotOptions.md).[`sets`](AIMLBotOptions.md#sets)

***

### substitutionFiles?

> `optional` **substitutionFiles?**: `object`

Defined in: bots/AIML1Bot.ts:21

Paths or content of substitution files, keyed by substitution type.

#### gender?

> `optional` **gender?**: [`FileSource`](../type-aliases/FileSource.md)

#### normal?

> `optional` **normal?**: [`FileSource`](../type-aliases/FileSource.md)

#### person?

> `optional` **person?**: [`FileSource`](../type-aliases/FileSource.md)

#### person2?

> `optional` **person2?**: [`FileSource`](../type-aliases/FileSource.md)

***

### substitutions?

> `optional` **substitutions?**: `Partial`\<[`Substitutions`](Substitutions.md)\>

Defined in: types.ts:173

Override any of the built-in substitution tables.

#### Inherited from

[`AIMLBotOptions`](AIMLBotOptions.md).[`substitutions`](AIMLBotOptions.md#substitutions)

***

### timezone?

> `optional` **timezone?**: `string`

Defined in: types.ts:196

IANA timezone for date/time tags.

#### Inherited from

[`AIMLBotOptions`](AIMLBotOptions.md).[`timezone`](AIMLBotOptions.md#timezone)
