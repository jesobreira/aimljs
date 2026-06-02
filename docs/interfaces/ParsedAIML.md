[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / ParsedAIML

# Interface: ParsedAIML

Defined in: parsers/AIMLParser.ts:15

The result of parsing an AIML XML document.

## See

[parseAIML](../functions/parseAIML.md)

## Properties

### categories

> **categories**: [`Category`](Category.md)[]

Defined in: parsers/AIMLParser.ts:17

All successfully parsed categories.

***

### errors

> **errors**: [`ValidationError`](ValidationError.md)[]

Defined in: parsers/AIMLParser.ts:21

Fatal parse errors that prevented specific categories from loading.

***

### version

> **version**: `"1.0"` \| `"2.0"`

Defined in: parsers/AIMLParser.ts:19

Detected AIML version from the root `<aiml version="...">` attribute.

***

### warnings

> **warnings**: [`ValidationError`](ValidationError.md)[]

Defined in: parsers/AIMLParser.ts:23

Non-fatal warnings (e.g. empty patterns).
