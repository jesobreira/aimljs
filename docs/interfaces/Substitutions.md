[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / Substitutions

# Interface: Substitutions

Defined in: [types.ts:81](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L81)

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

Defined in: [types.ts:86](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L86)

***

### gender

> **gender**: [`SubstitutionPair`](SubstitutionPair.md)[]

Defined in: [types.ts:85](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L85)

***

### normal

> **normal**: [`SubstitutionPair`](SubstitutionPair.md)[]

Defined in: [types.ts:82](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L82)

***

### person

> **person**: [`SubstitutionPair`](SubstitutionPair.md)[]

Defined in: [types.ts:83](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L83)

***

### person2

> **person2**: [`SubstitutionPair`](SubstitutionPair.md)[]

Defined in: [types.ts:84](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L84)
