[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / Normalizer

# Class: Normalizer

Defined in: core/Normalizer.ts:122

Text normalisation engine.

The `Normalizer` applies ordered substitution tables to transform text
before matching (input normalisation) and after generation (denormalisation).
It also provides the pronoun-swap transforms used by AIML template tags
(`<person>`, `<person2>`, `<gender>`) and string-case helpers.

All substitutions are applied in a **single pass** (see [applySubstitutions](../functions/applySubstitutions.md)),
so rules cannot inadvertently match text introduced by earlier rules.

## Example

```ts
const norm = new Normalizer();
norm.updateSubstitutions('normal', [
  buildSubstitutionPair("can't", 'cannot'),
  buildSubstitutionPair("won't", 'will not'),
]);

norm.normalize("I can't do it"); // → "I cannot do it"
norm.person("I am happy");       // → "he or she is happy"
norm.gender("he called her");    // → "she called him"
```

## Constructors

### Constructor

> **new Normalizer**(`substitutions?`): `Normalizer`

Defined in: core/Normalizer.ts:129

#### Parameters

##### substitutions?

`Partial`\<[`Substitutions`](../interfaces/Substitutions.md)\>

Override any built-in table.  Omitted tables
  fall back to [createDefaultSubstitutions](../functions/createDefaultSubstitutions.md).

#### Returns

`Normalizer`

## Methods

### addSubstitutions()

> **addSubstitutions**(`type`, `pairs`): `void`

Defined in: core/Normalizer.ts:154

Append rules to an existing substitution table.

#### Parameters

##### type

keyof [`Substitutions`](../interfaces/Substitutions.md)

Which table to extend.

##### pairs

[`SubstitutionPair`](../interfaces/SubstitutionPair.md)[]

Rules to append.

#### Returns

`void`

***

### denormalize()

> **denormalize**(`text`): `string`

Defined in: core/Normalizer.ts:180

Reverse normalisation applied to bot output.
Uses the `denormal` substitution table.

#### Parameters

##### text

`string`

#### Returns

`string`

***

### explode()

> **explode**(`text`): `string`

Defined in: core/Normalizer.ts:231

Insert a space between every character.
Used by the `<explode>` template tag.

#### Parameters

##### text

`string`

#### Returns

`string`

#### Example

```ts
explode('abc') // → 'a b c'
```

***

### formal()

> **formal**(`text`): `string`

Defined in: core/Normalizer.ts:215

Capitalise the first letter of every word (`Title Case`).

#### Parameters

##### text

`string`

#### Returns

`string`

***

### gender()

> **gender**(`text`): `string`

Defined in: core/Normalizer.ts:204

Apply gender pronoun substitution (he↔she, him↔her, …).
Used by the `<gender>` template tag.

#### Parameters

##### text

`string`

#### Returns

`string`

***

### lowercase()

> **lowercase**(`text`): `string`

Defined in: core/Normalizer.ts:212

Convert text to `lower case`.

#### Parameters

##### text

`string`

#### Returns

`string`

***

### normalize()

> **normalize**(`text`): `string`

Defined in: core/Normalizer.ts:164

Normalise user input before pattern matching.

Applies the `normal` substitution table (contractions, punctuation, etc.)
and collapses multiple spaces.

#### Parameters

##### text

`string`

#### Returns

`string`

***

### person()

> **person**(`text`): `string`

Defined in: core/Normalizer.ts:188

Apply first↔third person pronoun substitution.
Used by the `<person>` template tag.

#### Parameters

##### text

`string`

#### Returns

`string`

***

### person2()

> **person2**(`text`): `string`

Defined in: core/Normalizer.ts:196

Apply first↔second person pronoun substitution.
Used by the `<person2>` template tag.

#### Parameters

##### text

`string`

#### Returns

`string`

***

### sentence()

> **sentence**(`text`): `string`

Defined in: core/Normalizer.ts:220

Capitalise only the very first character (`Sentence case`).

#### Parameters

##### text

`string`

#### Returns

`string`

***

### updateSubstitutions()

> **updateSubstitutions**(`type`, `pairs`): `void`

Defined in: core/Normalizer.ts:145

Replace an entire substitution table.

#### Parameters

##### type

keyof [`Substitutions`](../interfaces/Substitutions.md)

Which table to replace.

##### pairs

[`SubstitutionPair`](../interfaces/SubstitutionPair.md)[]

New substitution rules.

#### Returns

`void`

***

### uppercase()

> **uppercase**(`text`): `string`

Defined in: core/Normalizer.ts:209

Convert text to `UPPER CASE`.

#### Parameters

##### text

`string`

#### Returns

`string`
