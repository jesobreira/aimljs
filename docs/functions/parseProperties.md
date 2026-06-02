[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / parseProperties

# Function: parseProperties()

> **parseProperties**(`data`): `Record`\<`string`, `string`\>

Defined in: parsers/DataParser.ts:122

Parse properties from any supported format (auto-detected).

- If `data` is already a plain object, keys are lower-cased and returned.
- If `data` is a JSON string (starts with `{`), [parsePropertiesJSON](parsePropertiesJSON.md) is used.
- Otherwise, [parsePropertiesText](parsePropertiesText.md) is used.

## Parameters

### data

`string` \| `Record`\<`string`, `string`\>

## Returns

`Record`\<`string`, `string`\>

## Example

```ts
// From object
parseProperties({ Name: 'Alice' })                // → { name: 'Alice' }
// From JSON string
parseProperties('{"name":"Alice"}')               // → { name: 'Alice' }
// From text
parseProperties('name:Alice\nversion:1.0')        // → { name:'Alice', version:'1.0' }
```
