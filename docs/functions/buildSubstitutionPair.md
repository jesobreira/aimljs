[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / buildSubstitutionPair

# Function: buildSubstitutionPair()

> **buildSubstitutionPair**(`find`, `replace`): [`SubstitutionPair`](../interfaces/SubstitutionPair.md)

Defined in: [core/Normalizer.ts:48](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/Normalizer.ts#L48)

Compile a find/replace pair into a [SubstitutionPair](../interfaces/SubstitutionPair.md).

The `find` string is matched as a whole word (word-boundary anchors are added
automatically) and the regex is global and case-insensitive.

## Parameters

### find

`string`

The text to find (not a regex — special chars are escaped).

### replace

`string`

The replacement string.

## Returns

[`SubstitutionPair`](../interfaces/SubstitutionPair.md)

## Example

```ts
const pair = buildSubstitutionPair("can't", "cannot");
"I can't do it".replace(pair.find, pair.replace); // "I cannot do it"
```
