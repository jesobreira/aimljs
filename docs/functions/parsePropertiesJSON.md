[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / parsePropertiesJSON

# Function: parsePropertiesJSON()

> **parsePropertiesJSON**(`json`): `Record`\<`string`, `string`\>

Defined in: [parsers/DataParser.ts:82](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/parsers/DataParser.ts#L82)

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
