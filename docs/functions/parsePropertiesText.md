[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / parsePropertiesText

# Function: parsePropertiesText()

> **parsePropertiesText**(`text`): `Record`\<`string`, `string`\>

Defined in: parsers/DataParser.ts:54

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
