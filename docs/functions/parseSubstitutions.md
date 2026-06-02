[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / parseSubstitutions

# Function: parseSubstitutions()

> **parseSubstitutions**(`data`): [`SubstitutionPair`](../interfaces/SubstitutionPair.md)[]

Defined in: parsers/DataParser.ts:203

Parse substitution rules from any supported format (auto-detected).

- If `data` is already a `SubstitutionPair[]`, it is returned as-is.
- If the string starts with `[` or `{`, [parseSubstitutionsJSON](parseSubstitutionsJSON.md) is used.
- Otherwise, [parseSubstitutionsText](parseSubstitutionsText.md) is used.

## Parameters

### data

`string` \| [`SubstitutionPair`](../interfaces/SubstitutionPair.md)[]

## Returns

[`SubstitutionPair`](../interfaces/SubstitutionPair.md)[]
