[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / parseSubstitutionsJSON

# Function: parseSubstitutionsJSON()

> **parseSubstitutionsJSON**(`json`): [`SubstitutionPair`](../interfaces/SubstitutionPair.md)[]

Defined in: [parsers/DataParser.ts:169](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/parsers/DataParser.ts#L169)

Parse substitution rules from a JSON string.

Accepts two shapes:
- Array: `[{ "find": "can't", "replace": "cannot" }, ...]`
- Object: `{ "can't": "cannot", "won't": "will not" }`

## Parameters

### json

`string`

## Returns

[`SubstitutionPair`](../interfaces/SubstitutionPair.md)[]
