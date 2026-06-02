[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / parseMapJSON

# Function: parseMapJSON()

> **parseMapJSON**(`json`): [`AIMLMap`](../type-aliases/AIMLMap.md)

Defined in: parsers/DataParser.ts:318

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
