[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / parsePattern

# Function: parsePattern()

> **parsePattern**(`raw`, `aimlVersion?`): [`ParsedPattern`](../interfaces/ParsedPattern.md)

Defined in: [core/PatternMatcher.ts:314](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/core/PatternMatcher.ts#L314)

Parse a raw AIML pattern string into a [ParsedPattern](../interfaces/ParsedPattern.md).

Supports:
- Exact words
- Wildcards: `*`, `_` (AIML 1.0); `#`, `^` (AIML 2.0 only)
- Set references: `<set name="color">` or `<set>color</set>`
- Bot property references: `<bot name="name">`

## Parameters

### raw

`string`

The pattern string (may contain inline XML tags).

### aimlVersion?

`"1.0"` \| `"2.0"`

Determines which wildcards are recognised.

## Returns

[`ParsedPattern`](../interfaces/ParsedPattern.md)

## Example

```ts
parsePattern('HELLO *')
// → { tokens: [{ type:'exact', word:'HELLO' }, { type:'wildcard', char:'*' }], raw:'HELLO *' }

parsePattern('I LIKE <set name="color">', '1.0')
// → { tokens: [..., { type:'set', name:'color' }], raw:'...' }
```
