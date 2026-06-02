[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / tokenize

# Function: tokenize()

> **tokenize**(`text`): `string`[]

Defined in: core/PatternMatcher.ts:289

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
