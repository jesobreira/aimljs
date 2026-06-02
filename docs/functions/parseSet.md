[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / parseSet

# Function: parseSet()

> **parseSet**(`data`): [`AIMLSet`](../type-aliases/AIMLSet.md)

Defined in: parsers/DataParser.ts:273

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
