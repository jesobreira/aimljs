[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / parseSubstitutions

# Function: parseSubstitutions()

> **parseSubstitutions**(`data`): [`SubstitutionPair`](../interfaces/SubstitutionPair.md)[]

Defined in: [parsers/DataParser.ts:203](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/parsers/DataParser.ts#L203)

Parse substitution rules from any supported format (auto-detected).

- If `data` is already a `SubstitutionPair[]`, it is returned as-is.
- If the string starts with `[` or `{`, [parseSubstitutionsJSON](parseSubstitutionsJSON.md) is used.
- Otherwise, [parseSubstitutionsText](parseSubstitutionsText.md) is used.

## Parameters

### data

`string` \| [`SubstitutionPair`](../interfaces/SubstitutionPair.md)[]

## Returns

[`SubstitutionPair`](../interfaces/SubstitutionPair.md)[]
