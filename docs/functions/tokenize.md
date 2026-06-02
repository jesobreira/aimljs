[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / tokenize

# Function: tokenize()

> **tokenize**(`text`): `string`[]

Defined in: [core/PatternMatcher.ts:289](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/PatternMatcher.ts#L289)

Split text into an array of words (tokens) for pattern matching.

Trims leading/trailing whitespace and collapses internal whitespace.

## Parameters

### text

`string`

## Returns

`string`[]

## Example

```ts
tokenize('  hello   world  ') // → ['hello', 'world']
tokenize('')                  // → []
```
