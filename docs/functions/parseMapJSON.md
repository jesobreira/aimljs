[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / parseMapJSON

# Function: parseMapJSON()

> **parseMapJSON**(`json`): [`AIMLMap`](../type-aliases/AIMLMap.md)

Defined in: [parsers/DataParser.ts:318](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/parsers/DataParser.ts#L318)

Parse a named map from a JSON object string.

## Parameters

### json

`string`

## Returns

[`AIMLMap`](../type-aliases/AIMLMap.md)

## Example

```ts
parseMapJSON('{"france":"Paris","germany":"Berlin"}')
// → Map { 'france' → 'Paris', 'germany' → 'Berlin' }
```
