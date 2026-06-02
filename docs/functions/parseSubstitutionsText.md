[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / parseSubstitutionsText

# Function: parseSubstitutionsText()

> **parseSubstitutionsText**(`text`): [`SubstitutionPair`](../interfaces/SubstitutionPair.md)[]

Defined in: [parsers/DataParser.ts:146](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/parsers/DataParser.ts#L146)

Parse substitution rules from a text file.

Each line should be `find : replace`.  Lines starting with `#` are comments.

## Parameters

### text

`string`

## Returns

[`SubstitutionPair`](../interfaces/SubstitutionPair.md)[]

## Example

```ts
parseSubstitutionsText("can't : cannot\nwon't : will not")
// → [SubstitutionPair for "can't"→"cannot", ...]
```
