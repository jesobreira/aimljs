[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / parseSetText

# Function: parseSetText()

> **parseSetText**(`text`): [`AIMLSet`](../type-aliases/AIMLSet.md)

Defined in: parsers/DataParser.ts:225

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
