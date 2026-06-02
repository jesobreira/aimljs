[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / TalkResult

# Interface: TalkResult

Defined in: [types.ts:208](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L208)

The result returned by [AIMLBot.talk](../classes/AIMLBot.md#talk).

## Example

```ts
const { response, sessionId } = await bot.talk('hello');
console.log(response); // "Hi there!"
```

## Properties

### response

> **response**: `string`

Defined in: [types.ts:210](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L210)

The bot's text response.

***

### sessionId

> **sessionId**: `string`

Defined in: [types.ts:212](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L212)

The session ID that was used (useful when none was passed).
