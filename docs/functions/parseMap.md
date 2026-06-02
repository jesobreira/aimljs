[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / parseMap

# Function: parseMap()

> **parseMap**(`data`): [`AIMLMap`](../type-aliases/AIMLMap.md)

Defined in: parsers/DataParser.ts:356

Parse a named map from any supported format (auto-detected).

- `Map<string, string>` → keys are lower-cased and returned.
- Plain object → keys are lower-cased.
- JSON string starting with `{` → [parseMapJSON](parseMapJSON.md).
- Otherwise → [parseMapText](parseMapText.md).

## Parameters

### data

`string` \| `Map`\<`string`, `string`\> \| `Record`\<`string`, `string`\>

## Returns

[`AIMLMap`](../type-aliases/AIMLMap.md)

## Example

```ts
parseMap({ France: 'Paris' })           // → Map { 'france' → 'Paris' }
parseMap('{"france":"Paris"}')          // → Map { 'france' → 'Paris' }
parseMap('france : Paris\njapan : Tokyo') // text format
```
