[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / AIMLSet

# Type Alias: AIMLSet

> **AIMLSet** = `Set`\<`string`\>

Defined in: types.ts:106

A named set of strings used in AIML pattern matching.

Sets can be used in patterns like `<set>color</set>` (AIML 1.0) or
`<set name="color"/>` (AIML 2.0) to match any member of the set.

## Example

```ts
bot.loadSet('color', ['red', 'green', 'blue']);
// Pattern: "MY FAVORITE COLOR IS <set>color</set>"
```
