[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / applySubstitutions

# Function: applySubstitutions()

> **applySubstitutions**(`text`, `pairs`): `string`

Defined in: [core/Normalizer.ts:17](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Normalizer.ts#L17)

Apply a list of substitution rules to a string in a single pass.

**Single-pass** means that replacement text produced by one rule is never
matched by a subsequent rule in the same call — this avoids the classic
gender-substitution problem where "he → she → he" loops.

## Parameters

### text

`string`

The input string.

### pairs

[`SubstitutionPair`](../interfaces/SubstitutionPair.md)[]

Ordered list of substitution rules.

## Returns

`string`
