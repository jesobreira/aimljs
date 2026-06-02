[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / AIMLMap

# Type Alias: AIMLMap

> **AIMLMap** = `Map`\<`string`, `string`\>

Defined in: types.ts:115

A named map of key→value strings used with the `<map>` template tag.

## Example

```ts
bot.loadMap('capitals', { france: 'Paris', japan: 'Tokyo' });
// Template: "The capital is <map name="capitals"><star/></map>"
```
