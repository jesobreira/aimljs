[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / MatchResult

# Interface: MatchResult

Defined in: [types.ts:263](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L263)

The result of a successful pattern match.

Contains the matched category and the wildcard captures for input,
`<that>`, and `<topic>` patterns respectively.

## Properties

### category

> **category**: [`Category`](Category.md)

Defined in: [types.ts:264](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L264)

***

### stars

> **stars**: `string`[]

Defined in: [types.ts:266](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L266)

Wildcard captures from the input pattern (`<star index="N"/>`).

***

### thatStars

> **thatStars**: `string`[]

Defined in: [types.ts:268](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L268)

Wildcard captures from the `<that>` pattern (`<thatstar index="N"/>`).

***

### topicStars

> **topicStars**: `string`[]

Defined in: [types.ts:270](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L270)

Wildcard captures from the `<topic>` pattern (`<topicstar index="N"/>`).
