[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / MatchResult

# Interface: MatchResult

Defined in: types.ts:263

The result of a successful pattern match.

Contains the matched category and the wildcard captures for input,
`<that>`, and `<topic>` patterns respectively.

## Properties

### category

> **category**: [`Category`](Category.md)

Defined in: types.ts:264

***

### stars

> **stars**: `string`[]

Defined in: types.ts:266

Wildcard captures from the input pattern (`<star index="N"/>`).

***

### thatStars

> **thatStars**: `string`[]

Defined in: types.ts:268

Wildcard captures from the `<that>` pattern (`<thatstar index="N"/>`).

***

### topicStars

> **topicStars**: `string`[]

Defined in: types.ts:270

Wildcard captures from the `<topic>` pattern (`<topicstar index="N"/>`).
