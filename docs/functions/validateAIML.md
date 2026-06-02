[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / validateAIML

# Function: validateAIML()

> **validateAIML**(`xml`, `fileName?`): [`ValidationResult`](../interfaces/ValidationResult.md)

Defined in: [parsers/AIMLParser.ts:225](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/parsers/AIMLParser.ts#L225)

Validate an AIML XML string without loading it into a bot.

A convenience wrapper around [parseAIML](parseAIML.md) that returns only the
validation result.

## Parameters

### xml

`string`

AIML XML string to validate.

### fileName?

`string`

Optional source file name for error messages.

## Returns

[`ValidationResult`](../interfaces/ValidationResult.md)

## Example

```ts
const result = validateAIML(xmlString, 'mybot.aiml');
if (!result.valid) {
  result.errors.forEach(e => console.error(e.message));
}
```
