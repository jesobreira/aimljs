[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / parseSubstitutionsText

# Function: parseSubstitutionsText()

> **parseSubstitutionsText**(`text`): [`SubstitutionPair`](../interfaces/SubstitutionPair.md)[]

Defined in: parsers/DataParser.ts:146

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
