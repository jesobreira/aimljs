[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / SessionData

# Interface: SessionData

Defined in: [types.ts:137](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L137)

Serialisable snapshot of a [Session](../classes/Session.md).

Persist this with `JSON.stringify` and restore it later with
[AIMLBot.loadSerializedSession](../classes/AIMLBot.md#loadserializedsession).

## Properties

### created

> **created**: `number`

Defined in: [types.ts:142](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L142)

***

### history

> **history**: [`ConversationTurn`](ConversationTurn.md)[]

Defined in: [types.ts:140](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L140)

***

### id

> **id**: `string`

Defined in: [types.ts:138](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L138)

***

### predicates

> **predicates**: `Record`\<`string`, `string`\>

Defined in: [types.ts:139](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L139)

***

### topic

> **topic**: `string`

Defined in: [types.ts:141](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L141)

***

### tripleStore?

> `optional` **tripleStore?**: [`TripleEntry`](TripleEntry.md)[]

Defined in: [types.ts:145](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L145)

AIML 2.0 triple store entries.

***

### updated

> **updated**: `number`

Defined in: [types.ts:143](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L143)
