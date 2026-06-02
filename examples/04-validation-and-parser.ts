/**
 * Example 4 — Validation and low-level parser API
 *
 * Demonstrates:
 *  - validateAIML() for checking XML without loading
 *  - parseAIML() for inspection / tooling
 *  - parseProperties / parseSet / parseMap / parseSubstitutions
 *  - PatternMatcher used standalone
 */

import {
  validateAIML,
  parseAIML,
  parseProperties,
  parseSet,
  parseMap,
  parseSubstitutions,
  PatternMatcher,
  buildSubstitutionPair,
} from '../src';

// ─── Validation ───────────────────────────────────────────────────────────────

console.log('=== Validation ===\n');

const goodXML = `<aiml version="1.0">
  <category>
    <pattern>HELLO</pattern>
    <template>Hi!</template>
  </category>
</aiml>`;

const badXML = `<aiml>
  <category>
    <pattern>HELLO</pattern>
    <!-- missing <template> -->
  </category>
</aiml>`;

const r1 = validateAIML(goodXML, 'good.aiml');
console.log('good.aiml valid:', r1.valid);          // true
console.log('errors:', r1.errors);                  // []

const r2 = validateAIML(badXML, 'bad.aiml');
console.log('\nbad.aiml valid:', r2.valid);          // false
console.log('errors:', r2.errors.map(e => e.message));

// ─── Low-level parser ─────────────────────────────────────────────────────────

console.log('\n=== parseAIML ===\n');

const { categories, version } = parseAIML(`
  <aiml version="1.0">
    <category>
      <pattern>MY NAME IS *</pattern>
      <template>Hello <star/>!</template>
    </category>
    <category>
      <pattern>HELLO</pattern>
      <template>Hi!</template>
    </category>
  </aiml>
`);

console.log('AIML version:', version);
console.log('Categories:', categories.length);
for (const cat of categories) {
  console.log(`  [${cat.aimlVersion}] pattern="${cat.pattern.raw}"  that="${cat.that.raw}"  topic="${cat.topic.raw}"`);
  console.log(`         tokens:`, cat.pattern.tokens);
}

// ─── Data parsers ─────────────────────────────────────────────────────────────

console.log('\n=== parseProperties ===\n');

const props1 = parseProperties('name:Alice\nversion:1.0\n# comment');
console.log('Text format:', props1);

const props2 = parseProperties({ Name: 'Bob', Version: '2.0' });
console.log('Object format:', props2);

const props3 = parseProperties('{"name":"Carol","age":"30"}');
console.log('JSON format:', props3);

console.log('\n=== parseSet ===\n');

const set1 = parseSet(['Red', 'Green', 'Blue']);
console.log('Array:', [...set1]);

const set2 = parseSet('cat\ndog\nfish\n# comment');
console.log('Text:', [...set2]);

const set3 = parseSet('["apple","banana","cherry"]');
console.log('JSON:', [...set3]);

console.log('\n=== parseMap ===\n');

const map1 = parseMap({ France: 'Paris', Germany: 'Berlin' });
console.log('Object:', Object.fromEntries(map1));

const map2 = parseMap('france : Paris\njapan : Tokyo');
console.log('Text:', Object.fromEntries(map2));

const map3 = parseMap('{"uk":"London","italy":"Rome"}');
console.log('JSON:', Object.fromEntries(map3));

console.log('\n=== parseSubstitutions ===\n');

const subs1 = parseSubstitutions("can't : cannot\nwon't : will not");
console.log('Text subs:', subs1.map(p => ({ replace: p.replace })));

const subs2 = parseSubstitutions('[{"find":"hello","replace":"hi"}]');
console.log('JSON array subs:', subs2.map(p => ({ replace: p.replace })));

// ─── PatternMatcher standalone ────────────────────────────────────────────────

console.log('\n=== PatternMatcher standalone ===\n');

const matcher = new PatternMatcher();

// Build categories directly from parseAIML
const { categories: cats } = parseAIML(`
  <aiml>
    <category><pattern>HELLO *</pattern><template>greeting</template></category>
    <category><pattern>_ WORLD</pattern><template>underscore-world</template></category>
    <category><pattern>MY NAME IS *</pattern><template>name-capture</template></category>
  </aiml>
`);

matcher.addCategories(cats);
matcher.setSet('color', new Set(['red', 'green', 'blue']));

const cases = [
  ['hello Alice', '*', '*'],
  ['hello world', '*', '*'],   // _ WORLD has higher priority
  ['my name is Bob', '*', '*'],
  ['goodbye', '*', '*'],        // no match
] as const;

for (const [input, that, topic] of cases) {
  const result = matcher.match(input, that, topic);
  if (result) {
    console.log(`"${input}" → pattern="${result.category.pattern.raw}" stars=${JSON.stringify(result.stars)}`);
  } else {
    console.log(`"${input}" → no match`);
  }
}
