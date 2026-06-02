[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / Category

# Interface: Category

Defined in: types.ts:42

A single AIML category: the fundamental unit of an AIML knowledge base.

A category is a triple of (pattern, that, topic) → template.
The bot matches the user's input against `pattern`, the last bot response
against `that`, and the current conversation topic against `topic`.

## Properties

### aimlVersion

> **aimlVersion**: `"1.0"` \| `"2.0"`

Defined in: types.ts:56

AIML version this category was parsed under.

***

### file?

> `optional` **file?**: `string`

Defined in: types.ts:54

Source file name (if loaded from a file).

***

### id

> **id**: `string`

Defined in: types.ts:44

Unique identifier generated at parse time.

***

### pattern

> **pattern**: [`ParsedPattern`](ParsedPattern.md)

Defined in: types.ts:46

The input pattern to match.

***

### template

> **template**: `Node`

Defined in: types.ts:52

The parsed XML template node.

***

### that

> **that**: [`ParsedPattern`](ParsedPattern.md)

Defined in: types.ts:48

The `<that>` context pattern (defaults to `*`).

***

### topic

> **topic**: [`ParsedPattern`](ParsedPattern.md)

Defined in: types.ts:50

The `<topic>` pattern (defaults to `*`).
