[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / parseMapText

# Function: parseMapText()

> **parseMapText**(`text`): [`AIMLMap`](../type-aliases/AIMLMap.md)

Defined in: parsers/DataParser.ts:295

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
