[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / ConversationTurn

# Interface: ConversationTurn

Defined in: [types.ts:120](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L120)

A single turn in a conversation (input + bot response).

## Properties

### input

> **input**: `string`

Defined in: [types.ts:122](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L122)

The normalised user input.

***

### response

> **response**: `string`

Defined in: [types.ts:124](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L124)

The bot's response.

***

### timestamp

> **timestamp**: `number`

Defined in: [types.ts:126](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L126)

Unix timestamp (ms) of the turn.

***

### topic

> **topic**: `string`

Defined in: [types.ts:128](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L128)

The conversation topic at the time of this turn.
