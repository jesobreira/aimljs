[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / Substitutions

# Interface: Substitutions

Defined in: types.ts:81

The full set of substitution tables used by the normalizer.

| Table      | Purpose |
|------------|---------|
| `normal`   | Input normalisation (contractions, punctuation, etc.) |
| `person`   | First ↔ third person pronoun swap |
| `person2`  | First ↔ second person pronoun swap |
| `gender`   | Gender pronoun swap (he ↔ she, him ↔ her, …) |
| `denormal` | Reverse of `normal`, applied to bot output |

## Properties

### denormal

> **denormal**: [`SubstitutionPair`](SubstitutionPair.md)[]

Defined in: types.ts:86

***

### gender

> **gender**: [`SubstitutionPair`](SubstitutionPair.md)[]

Defined in: types.ts:85

***

### normal

> **normal**: [`SubstitutionPair`](SubstitutionPair.md)[]

Defined in: types.ts:82

***

### person

> **person**: [`SubstitutionPair`](SubstitutionPair.md)[]

Defined in: types.ts:83

***

### person2

> **person2**: [`SubstitutionPair`](SubstitutionPair.md)[]

Defined in: types.ts:84
