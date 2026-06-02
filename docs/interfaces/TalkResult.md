[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / TalkResult

# Interface: TalkResult

Defined in: types.ts:208

The result returned by [AIMLBot.talk](../classes/AIMLBot.md#talk).

## Example

```ts
const { response, sessionId } = await bot.talk('hello');
console.log(response); // "Hi there!"
```

## Properties

### response

> **response**: `string`

Defined in: types.ts:210

The bot's text response.

***

### sessionId

> **sessionId**: `string`

Defined in: types.ts:212

The session ID that was used (useful when none was passed).
