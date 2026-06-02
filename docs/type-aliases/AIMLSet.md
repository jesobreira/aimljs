[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / AIMLSet

# Type Alias: AIMLSet

> **AIMLSet** = `Set`\<`string`\>

Defined in: [types.ts:106](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L106)

A named set of strings used in AIML pattern matching.

Sets can be used in patterns like `<set>color</set>` (AIML 1.0) or
`<set name="color"/>` (AIML 2.0) to match any member of the set.

## Example

```ts
bot.loadSet('color', ['red', 'green', 'blue']);
// Pattern: "MY FAVORITE COLOR IS <set>color</set>"
```
