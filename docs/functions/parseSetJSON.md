[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / parseSetJSON

# Function: parseSetJSON()

> **parseSetJSON**(`json`): [`AIMLSet`](../type-aliases/AIMLSet.md)

Defined in: [parsers/DataParser.ts:242](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/parsers/DataParser.ts#L242)

Parse a named set from a JSON array string.

## Parameters

### json

`string`

## Returns

[`AIMLSet`](../type-aliases/AIMLSet.md)

## Example

```ts
parseSetJSON('["cat","dog","fish"]') // → Set { 'cat', 'dog', 'fish' }
```
