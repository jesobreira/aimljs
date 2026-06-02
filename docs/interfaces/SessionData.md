[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / SessionData

# Interface: SessionData

Defined in: types.ts:137

Serialisable snapshot of a [Session](../classes/Session.md).

Persist this with `JSON.stringify` and restore it later with
[AIMLBot.loadSerializedSession](../classes/AIMLBot.md#loadserializedsession).

## Properties

### created

> **created**: `number`

Defined in: types.ts:142

***

### history

> **history**: [`ConversationTurn`](ConversationTurn.md)[]

Defined in: types.ts:140

***

### id

> **id**: `string`

Defined in: types.ts:138

***

### predicates

> **predicates**: `Record`\<`string`, `string`\>

Defined in: types.ts:139

***

### topic

> **topic**: `string`

Defined in: types.ts:141

***

### tripleStore?

> `optional` **tripleStore?**: [`TripleEntry`](TripleEntry.md)[]

Defined in: types.ts:145

AIML 2.0 triple store entries.

***

### updated

> **updated**: `number`

Defined in: types.ts:143
