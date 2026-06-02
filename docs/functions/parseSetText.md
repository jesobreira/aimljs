[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / parseSetText

# Function: parseSetText()

> **parseSetText**(`text`): [`AIMLSet`](../type-aliases/AIMLSet.md)

Defined in: [parsers/DataParser.ts:225](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/parsers/DataParser.ts#L225)

Parse a named set from a text file.

One item per line; blank lines and `#`-prefixed comments are ignored.
All items are lower-cased.

## Parameters

### text

`string`

## Returns

[`AIMLSet`](../type-aliases/AIMLSet.md)

## Example

```ts
parseSetText('red\ngreen\nblue\n# primary colours')
// → Set { 'red', 'green', 'blue' }
```
