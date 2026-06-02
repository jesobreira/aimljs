[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / parseSubstitutionsJSON

# Function: parseSubstitutionsJSON()

> **parseSubstitutionsJSON**(`json`): [`SubstitutionPair`](../interfaces/SubstitutionPair.md)[]

Defined in: parsers/DataParser.ts:169

Parse substitution rules from a JSON string.

Accepts two shapes:
- Array: `[{ "find": "can't", "replace": "cannot" }, ...]`
- Object: `{ "can't": "cannot", "won't": "will not" }`

## Parameters

### json

`string`

## Returns

[`SubstitutionPair`](../interfaces/SubstitutionPair.md)[]
