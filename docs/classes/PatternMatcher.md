[**aimljs v1.0.0**](../README.md)

***

[aimljs](../globals.md) / PatternMatcher

# Class: PatternMatcher

Defined in: core/PatternMatcher.ts:145

Low-level pattern matching engine.

Stores a list of [Category](../interfaces/Category.md) objects and efficiently finds the
highest-priority match for a given (input, that, topic) triple.

Priority follows the AIML specification:
- AIML 1.0: `_` > exact > `*`
- AIML 2.0: `#` > `_` > exact/set > `^` > `*`

You do not normally need to use this class directly — the bot classes
([AIMLBot](AIMLBot.md), [AIML1Bot](AIML1Bot.md), [AIML2Bot](AIML2Bot.md)) manage it internally.

## Example

```ts
const matcher = new PatternMatcher();
matcher.addCategories(parseAIML(xml).categories);

const result = matcher.match('hello world', '*', '*');
if (result) {
  console.log('stars:', result.stars); // wildcard captures
}
```

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: core/PatternMatcher.ts:205

Total number of loaded categories.

##### Returns

`number`

## Constructors

### Constructor

> **new PatternMatcher**(): `PatternMatcher`

#### Returns

`PatternMatcher`

## Methods

### addCategories()

> **addCategories**(`cats`): `void`

Defined in: core/PatternMatcher.ts:164

Add multiple categories at once.
More efficient than calling [addCategory](#addcategory) in a loop.

#### Parameters

##### cats

[`Category`](../interfaces/Category.md)[]

#### Returns

`void`

***

### addCategory()

> **addCategory**(`cat`): `void`

Defined in: core/PatternMatcher.ts:155

Add a single category to the matcher.
Triggers a re-sort on the next [match](#match) call.

#### Parameters

##### cat

[`Category`](../interfaces/Category.md)

#### Returns

`void`

***

### clear()

> **clear**(): `void`

Defined in: core/PatternMatcher.ts:181

Remove all categories.

#### Returns

`void`

***

### match()

> **match**(`input`, `that`, `topic`): [`MatchResult`](../interfaces/MatchResult.md) \| `null`

Defined in: core/PatternMatcher.ts:234

Find the highest-priority category that matches the given triple.

All three strings are tokenised and matched against the stored patterns.
Returns `null` if no category matches.

#### Parameters

##### input

`string`

Normalised user input.

##### that

`string`

Last bot sentence (use `"*"` if no prior response).

##### topic

`string`

Current conversation topic (use `"default"` if unset).

#### Returns

[`MatchResult`](../interfaces/MatchResult.md) \| `null`

#### Example

```ts
const result = matcher.match('my name is Alice', '*', 'default');
// result.category → the matched Category
// result.stars[0] → 'Alice'
```

***

### removeByFile()

> **removeByFile**(`file`): `void`

Defined in: core/PatternMatcher.ts:175

Remove all categories that were loaded from a specific file.
Useful for hot-reloading individual AIML files.

#### Parameters

##### file

`string`

The file name/path to remove categories from.

#### Returns

`void`

***

### setBotProperties()

> **setBotProperties**(`props`): `void`

Defined in: core/PatternMatcher.ts:200

Provide the current bot properties so `<bot name="...">` pattern
tokens can be evaluated during matching.

#### Parameters

##### props

`Record`\<`string`, `string`\>

#### Returns

`void`

***

### setSet()

> **setSet**(`name`, `set`): `void`

Defined in: core/PatternMatcher.ts:192

Register a named set for use in `<set name="...">` pattern tokens.

#### Parameters

##### name

`string`

Set name (case-insensitive).

##### set

[`AIMLSet`](../type-aliases/AIMLSet.md)

Set of lower-cased strings.

#### Returns

`void`
