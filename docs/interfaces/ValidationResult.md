[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / ValidationResult

# Interface: ValidationResult

Defined in: types.ts:249

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

Defined in: types.ts:251

***

### valid

> **valid**: `boolean`

Defined in: types.ts:250

***

### warnings

> **warnings**: [`ValidationError`](ValidationError.md)[]

Defined in: types.ts:252
