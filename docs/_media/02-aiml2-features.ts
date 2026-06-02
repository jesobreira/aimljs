/**
 * Example 2 — AIML 2.0 features
 *
 * Demonstrates:
 *  - AIML 2.0 wildcards (#, ^)
 *  - Named maps with <map>
 *  - Named sets in patterns
 *  - Triple store (<addtriple> / <uniq>)
 *  - <sraix> external service calls
 *  - <learn> at runtime
 *  - <normalize> / <explode> / <first> / <rest>
 */

import { AIML2Bot } from '../src';

const AIML = `<?xml version="1.0" encoding="UTF-8"?>
<aiml version="2.0">

  <!-- # matches zero or more words (highest priority wildcard) -->
  <category>
    <pattern># HELLO #</pattern>
    <template>I detected a hello!</template>
  </category>

  <!-- Named map lookup -->
  <category>
    <pattern>CAPITAL OF *</pattern>
    <template>The capital of <star/> is <map name="capitals"><star/></map>.</template>
  </category>

  <!-- Named set in pattern -->
  <category>
    <pattern>I HAVE A <set>pet</set></pattern>
    <template>How lovely! A <star/> sounds like a great pet.</template>
  </category>

  <!-- Triple store: store a fact -->
  <category>
    <pattern>* LIKES *</pattern>
    <template>
      <addtriple>
        <subj><star index="1"/></subj>
        <pred>likes</pred>
        <obj><star index="2"/></obj>
      </addtriple>
      Got it — I'll remember that <star index="1"/> likes <star index="2"/>.
    </template>
  </category>

  <!-- Triple store: query a fact -->
  <category>
    <pattern>WHAT DOES * LIKE</pattern>
    <template>
      <star/> likes <uniq>
        <subj><star/></subj>
        <pred>likes</pred>
        <obj>?x</obj>
      </uniq>.
    </template>
  </category>

  <!-- External service via <sraix> -->
  <category>
    <pattern>WEATHER IN *</pattern>
    <template>
      Weather in <star/>: <sraix service="weather"><star/></sraix>
    </template>
  </category>

  <!-- String utilities -->
  <category>
    <pattern>EXPLODE *</pattern>
    <template><explode><star/></explode></template>
  </category>

  <category>
    <pattern>FIRST WORD OF *</pattern>
    <template><first><star/></first></template>
  </category>

  <category>
    <pattern>REST OF *</pattern>
    <template><rest><star/></rest></template>
  </category>

  <!-- <learn>: teach the bot at runtime -->
  <category>
    <pattern>LEARN THAT * MEANS *</pattern>
    <template>
      <learn>
        <category>
          <pattern>WHAT DOES <eval><star index="1"/></eval> MEAN</pattern>
          <template><eval><star index="2"/></eval></template>
        </category>
      </learn>
      OK, I've learned that <star index="1"/> means <star index="2"/>.
    </template>
  </category>

</aiml>`;

async function main() {
  // ─── Capitals map ────────────────────────────────────────────────────────
  const capitals = {
    france: 'Paris',
    germany: 'Berlin',
    japan: 'Tokyo',
    brazil: 'Brasília',
    australia: 'Canberra',
  };

  // ─── Pets set ────────────────────────────────────────────────────────────
  const pets = ['cat', 'dog', 'rabbit', 'hamster', 'parrot', 'fish'];

  // ─── External weather service mock ───────────────────────────────────────
  const sraixHandler = async (service: string, input: string): Promise<string> => {
    if (service === 'weather') {
      const mock: Record<string, string> = {
        paris: '15°C, partly cloudy',
        tokyo: '22°C, sunny',
        berlin: '8°C, rainy',
      };
      return mock[input.toLowerCase()] ?? 'unavailable';
    }
    return '';
  };

  const bot = new AIML2Bot({
    properties: { name: 'Rosie' },
    maps: { capitals },
    sets: { pet: pets },
    sraixHandler,
  });

  await bot.loadXMLString(AIML, 'aiml2-example.aiml');
  console.log(`Loaded ${bot.categoryCount} categories.\n`);

  const SID = 'demo';

  const turns: string[] = [
    'hey there hello world',       // # HELLO # wildcard
    'capital of japan',            // map lookup
    'i have a rabbit',             // set match
    'Alice likes jazz',            // triple store: store
    'what does alice like',        // triple store: query
    'weather in paris',            // sraix
    'explode abc',                 // string util
    'first word of hello world',
    'rest of one two three four',
    'learn that AIML means Artificial Intelligence Markup Language',
    'what does AIML mean',         // dynamically learned category
  ];

  for (const input of turns) {
    const { response } = await bot.talk(input, SID);
    console.log(`User: ${input}`);
    console.log(`Bot:  ${response.trim()}\n`);
  }
}

main().catch(console.error);
