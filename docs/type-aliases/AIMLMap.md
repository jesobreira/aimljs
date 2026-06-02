[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / AIMLMap

# Type Alias: AIMLMap

> **AIMLMap** = `Map`\<`string`, `string`\>

Defined in: [types.ts:115](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L115)

A named map of key→value strings used with the `<map>` template tag.

## Example

```ts
bot.loadMap('capitals', { france: 'Paris', japan: 'Tokyo' });
// Template: "The capital is <map name="capitals"><star/></map>"
```
