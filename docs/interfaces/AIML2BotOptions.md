[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / AIML2BotOptions

# Interface: AIML2BotOptions

Defined in: [bots/AIML2Bot.ts:12](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIML2Bot.ts#L12)

Constructor options specific to [AIML2Bot](../classes/AIML2Bot.md).

## Extends

- [`AIMLBotOptions`](AIMLBotOptions.md)

## Properties

### aimlVersion?

> `optional` **aimlVersion?**: `"1.0"` \| `"2.0"`

Defined in: [bots/AIMLBot.ts:40](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L40)

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

Defined in: [types.ts:192](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L192)

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

Defined in: [bots/AIMLBot.ts:51](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L51)

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

Defined in: [bots/AIMLBot.ts:46](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIMLBot.ts#L46)

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

Defined in: [types.ts:194](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L194)

BCP-47 locale used for date formatting.

#### Inherited from

[`AIMLBotOptions`](AIMLBotOptions.md).[`locale`](AIMLBotOptions.md#locale)

***

### maps?

> `optional` **maps?**: `Record`\<`string`, `Map`\<`string`, `string`\> \| `Record`\<`string`, `string`\>\>

Defined in: [types.ts:177](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L177)

Pre-load named maps (object, Map, or `key:value` text).

#### Inherited from

[`AIMLBotOptions`](AIMLBotOptions.md).[`maps`](AIMLBotOptions.md#maps)

***

### maxLoopIterations?

> `optional` **maxLoopIterations?**: `number`

Defined in: [types.ts:187](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L187)

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

Defined in: [types.ts:182](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L182)

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

Defined in: [types.ts:169](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L169)

Display name exposed via `<bot name="name"/>`.

#### Inherited from

[`AIMLBotOptions`](AIMLBotOptions.md).[`name`](AIMLBotOptions.md#name)

***

### properties?

> `optional` **properties?**: [`BotProperties`](BotProperties.md)

Defined in: [types.ts:171](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L171)

Initial bot properties (see [BotProperties](BotProperties.md)).

#### Inherited from

[`AIMLBotOptions`](AIMLBotOptions.md).[`properties`](AIMLBotOptions.md#properties)

***

### sets?

> `optional` **sets?**: `Record`\<`string`, `string`[] \| `Set`\<`string`\>\>

Defined in: [types.ts:175](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L175)

Pre-load named sets (string array, Set, or one-per-line text).

#### Inherited from

[`AIMLBotOptions`](AIMLBotOptions.md).[`sets`](AIMLBotOptions.md#sets)

***

### sraixHandler?

> `optional` **sraixHandler?**: (`service`, `input`) => `Promise`\<`string`\>

Defined in: [bots/AIML2Bot.ts:29](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/bots/AIML2Bot.ts#L29)

Handler for `<sraix service="...">` tags.

Called with the service name and the evaluated inner text.
Return the response string, or throw to trigger the `default` attribute.

#### Parameters

##### service

`string`

##### input

`string`

#### Returns

`Promise`\<`string`\>

#### Example

```ts
const bot = new AIML2Bot({
  sraixHandler: async (service, input) => {
    if (service === 'weather') return await fetchWeather(input);
    return '';
  }
});
```

***

### substitutions?

> `optional` **substitutions?**: `Partial`\<[`Substitutions`](Substitutions.md)\>

Defined in: [types.ts:173](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L173)

Override any of the built-in substitution tables.

#### Inherited from

[`AIMLBotOptions`](AIMLBotOptions.md).[`substitutions`](AIMLBotOptions.md#substitutions)

***

### timezone?

> `optional` **timezone?**: `string`

Defined in: [types.ts:196](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L196)

IANA timezone for date/time tags.

#### Inherited from

[`AIMLBotOptions`](AIMLBotOptions.md).[`timezone`](AIMLBotOptions.md#timezone)
