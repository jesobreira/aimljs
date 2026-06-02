[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / parseSet

# Function: parseSet()

> **parseSet**(`data`): [`AIMLSet`](../type-aliases/AIMLSet.md)

Defined in: [parsers/DataParser.ts:273](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/parsers/DataParser.ts#L273)

Parse a named set from any supported format (auto-detected).

- `Set<string>` → items are lower-cased and returned.
- `string[]`    → items are lower-cased.
- JSON string starting with `[` → [parseSetJSON](parseSetJSON.md).
- Otherwise → [parseSetText](parseSetText.md).

## Parameters

### data

`string` \| `string`[] \| `Set`\<`string`\>

## Returns

[`AIMLSet`](../type-aliases/AIMLSet.md)

## Example

```ts
parseSet(['Red', 'Green', 'Blue'])  // → Set { 'red', 'green', 'blue' }
parseSet('["cat","dog"]')           // → Set { 'cat', 'dog' }
parseSet('cat\ndog\nfish')          // → Set { 'cat', 'dog', 'fish' }
```
