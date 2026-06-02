[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / parseAIML

# Function: parseAIML()

> **parseAIML**(`xml`, `fileName?`, `defaultVersion?`): [`ParsedAIML`](../interfaces/ParsedAIML.md)

Defined in: [parsers/AIMLParser.ts:59](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/parsers/AIMLParser.ts#L59)

Parse an AIML XML string into a list of [Category](../interfaces/Category.md) objects.

Supports both AIML 1.0 and 2.0 syntax.  The version is auto-detected
from the `version` attribute on the root `<aiml>` element.

Features handled:
- `<category>` elements at the root level
- `<topic name="...">` wrappers
- `<that>` context inside categories
- `<set name="...">` and `<set>name</set>` in patterns (both forms)
- `<bot name="...">` in patterns

## Parameters

### xml

`string`

Raw AIML XML string.

### fileName?

`string`

Optional source file name (used in error messages).

### defaultVersion?

`"1.0"` \| `"2.0"`

Version to assume if the `<aiml>` tag has no `version` attribute.

## Returns

[`ParsedAIML`](../interfaces/ParsedAIML.md)

Parsed result including categories, errors, and warnings.

## Example

```ts
const xml = `<aiml version="1.0">
  <category>
    <pattern>HELLO</pattern>
    <template>Hi!</template>
  </category>
</aiml>`;

const { categories, errors } = parseAIML(xml, 'greetings.aiml');
console.log(categories.length); // 1
```
