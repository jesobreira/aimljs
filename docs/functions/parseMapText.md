[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / parseMapText

# Function: parseMapText()

> **parseMapText**(`text`): [`AIMLMap`](../type-aliases/AIMLMap.md)

Defined in: [parsers/DataParser.ts:295](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/parsers/DataParser.ts#L295)

Parse a named map from a text file.

Each non-blank, non-comment line must be `key : value`.
Keys are lower-cased; values are preserved as-is.

## Parameters

### text

`string`

## Returns

[`AIMLMap`](../type-aliases/AIMLMap.md)

## Example

```ts
parseMapText('france : Paris\ngermany : Berlin')
// → Map { 'france' → 'Paris', 'germany' → 'Berlin' }
```
