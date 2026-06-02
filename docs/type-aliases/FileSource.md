[**aiml.js v1.0.1**](../README.md)

***

[aiml.js](../globals.md) / FileSource

# Type Alias: FileSource

> **FileSource** = `string` \| \{ `content`: `string`; `name`: `string`; \} \| `File`

Defined in: [types.ts:225](https://github.com/jesobreira/aimljs/blob/d8104ce59bfa79bf2060f0fdc08bc026969d8990/src/types.ts#L225)

A source that can be loaded as an AIML file.

Three forms are accepted:
- **`string`** – Node.js file-system path (server only).
- **`{ name, content }`** – Pre-loaded in-memory content (works everywhere).
- **`File`** – Browser [File](https://developer.mozilla.org/en-US/docs/Web/API/File) object from `<input type="file">`.
