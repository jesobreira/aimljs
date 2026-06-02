[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / parsePropertiesText

# Function: parsePropertiesText()

> **parsePropertiesText**(`text`): `Record`\<`string`, `string`\>

Defined in: [parsers/DataParser.ts:54](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/parsers/DataParser.ts#L54)

Parse a properties text file.

Each non-blank, non-comment line must contain a separator (`:` or `=`).
Keys are lower-cased.

## Parameters

### text

`string`

## Returns

`Record`\<`string`, `string`\>

## Example

```ts
parsePropertiesText(`
  name : Alice
  age  : 21
  # this is a comment
`)
// → { name: 'Alice', age: '21' }
```
