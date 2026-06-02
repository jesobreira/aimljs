[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / parseSetJSON

# Function: parseSetJSON()

> **parseSetJSON**(`json`): [`AIMLSet`](../type-aliases/AIMLSet.md)

Defined in: parsers/DataParser.ts:242

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
