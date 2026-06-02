[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / PatternToken

# Type Alias: PatternToken

> **PatternToken** = \{ `type`: `"exact"`; `word`: `string`; \} \| \{ `char`: [`WildcardChar`](WildcardChar.md); `type`: `"wildcard"`; \} \| \{ `name`: `string`; `type`: `"set"`; \} \| \{ `name`: `string`; `type`: `"bot"`; \}

Defined in: [types.ts:23](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L23)

A single token in a parsed AIML pattern.

Patterns are split into tokens that are either exact words, wildcards,
set references, or bot-property references.

## Example

```ts
// Pattern "HELLO *" produces two tokens:
// { type: 'exact', word: 'HELLO' }
// { type: 'wildcard', char: '*' }
```
