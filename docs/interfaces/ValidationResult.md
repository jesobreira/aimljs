[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / ValidationResult

# Interface: ValidationResult

Defined in: [types.ts:249](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L249)

Result of [validateAIML](../functions/validateAIML.md) or [AIMLBot.validateXML](../classes/AIMLBot.md#validatexml).

## Example

```ts
const result = bot.validateXML(xml);
if (!result.valid) {
  for (const err of result.errors) console.error(err.message);
}
```

## Properties

### errors

> **errors**: [`ValidationError`](ValidationError.md)[]

Defined in: [types.ts:251](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L251)

***

### valid

> **valid**: `boolean`

Defined in: [types.ts:250](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L250)

***

### warnings

> **warnings**: [`ValidationError`](ValidationError.md)[]

Defined in: [types.ts:252](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L252)
