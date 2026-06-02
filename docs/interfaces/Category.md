[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / Category

# Interface: Category

Defined in: [types.ts:42](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L42)

A single AIML category: the fundamental unit of an AIML knowledge base.

A category is a triple of (pattern, that, topic) → template.
The bot matches the user's input against `pattern`, the last bot response
against `that`, and the current conversation topic against `topic`.

## Properties

### aimlVersion

> **aimlVersion**: `"1.0"` \| `"2.0"`

Defined in: [types.ts:56](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L56)

AIML version this category was parsed under.

***

### file?

> `optional` **file?**: `string`

Defined in: [types.ts:54](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L54)

Source file name (if loaded from a file).

***

### id

> **id**: `string`

Defined in: [types.ts:44](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L44)

Unique identifier generated at parse time.

***

### pattern

> **pattern**: [`ParsedPattern`](ParsedPattern.md)

Defined in: [types.ts:46](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L46)

The input pattern to match.

***

### template

> **template**: `Node`

Defined in: [types.ts:52](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L52)

The parsed XML template node.

***

### that

> **that**: [`ParsedPattern`](ParsedPattern.md)

Defined in: [types.ts:48](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L48)

The `<that>` context pattern (defaults to `*`).

***

### topic

> **topic**: [`ParsedPattern`](ParsedPattern.md)

Defined in: [types.ts:50](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L50)

The `<topic>` pattern (defaults to `*`).
