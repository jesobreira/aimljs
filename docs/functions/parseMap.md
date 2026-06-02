[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / parseMap

# Function: parseMap()

> **parseMap**(`data`): [`AIMLMap`](../type-aliases/AIMLMap.md)

Defined in: [parsers/DataParser.ts:356](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/parsers/DataParser.ts#L356)

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
