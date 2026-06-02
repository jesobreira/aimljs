[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / parsePropertiesJSON

# Function: parsePropertiesJSON()

> **parsePropertiesJSON**(`json`): `Record`\<`string`, `string`\>

Defined in: parsers/DataParser.ts:82

Parse a JSON properties object.  Keys are lower-cased.

## Parameters

### json

`string`

## Returns

`Record`\<`string`, `string`\>

## Example

```ts
parsePropertiesJSON('{"name":"Alice","version":"1.0"}')
// → { name: 'Alice', version: '1.0' }
```
