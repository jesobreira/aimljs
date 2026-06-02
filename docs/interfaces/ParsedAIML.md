[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / ParsedAIML

# Interface: ParsedAIML

Defined in: [parsers/AIMLParser.ts:15](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/parsers/AIMLParser.ts#L15)

The result of parsing an AIML XML document.

## See

[parseAIML](../functions/parseAIML.md)

## Properties

### categories

> **categories**: [`Category`](Category.md)[]

Defined in: [parsers/AIMLParser.ts:17](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/parsers/AIMLParser.ts#L17)

All successfully parsed categories.

***

### errors

> **errors**: [`ValidationError`](ValidationError.md)[]

Defined in: [parsers/AIMLParser.ts:21](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/parsers/AIMLParser.ts#L21)

Fatal parse errors that prevented specific categories from loading.

***

### version

> **version**: `"1.0"` \| `"2.0"`

Defined in: [parsers/AIMLParser.ts:19](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/parsers/AIMLParser.ts#L19)

Detected AIML version from the root `<aiml version="...">` attribute.

***

### warnings

> **warnings**: [`ValidationError`](ValidationError.md)[]

Defined in: [parsers/AIMLParser.ts:23](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/parsers/AIMLParser.ts#L23)

Non-fatal warnings (e.g. empty patterns).
