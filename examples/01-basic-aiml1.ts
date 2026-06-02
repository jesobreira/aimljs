/**
 * Example 1 — Basic AIML 1.0 bot
 *
 * Demonstrates:
 *  - Loading AIML from a string
 *  - Talking to the bot (default session)
 *  - Talking with an explicit session ID
 *  - Setting bot properties
 *  - Predicates (<set> / <get>)
 *  - <srai> recursion
 *  - Topic-based responses
 */

import { AIML1Bot } from '../src';

// ─── 1. Define AIML knowledge base ──────────────────────────────────────────

const AIML = `<?xml version="1.0" encoding="UTF-8"?>
<aiml version="1.0">

  <!-- Basic greeting -->
  <category>
    <pattern>HELLO</pattern>
    <template>Hi! I'm <bot name="name"/>. What's your name?</template>
  </category>

  <!-- Capture and store the user's name -->
  <category>
    <pattern>MY NAME IS *</pattern>
    <template>
      <think><set name="username"><star/></set></think>
      Nice to meet you, <star/>!
    </template>
  </category>

  <!-- Retrieve the stored name -->
  <category>
    <pattern>WHAT IS MY NAME</pattern>
    <template>
      <condition name="username">
        <li value="">I don't know your name yet.</li>
        <li>Your name is <get name="username"/>.</li>
      </condition>
    </template>
  </category>

  <!-- <srai> redirects to another category -->
  <category>
    <pattern>HI</pattern>
    <template><srai>HELLO</srai></template>
  </category>

  <!-- Wildcard capture + uppercase transform -->
  <category>
    <pattern>SAY *</pattern>
    <template><uppercase><star/></uppercase></template>
  </category>

  <!-- Topic switching -->
  <category>
    <pattern>TALK ABOUT *</pattern>
    <template>
      <think><set name="topic"><star/></set></think>
      Sure, let's talk about <star/>.
    </template>
  </category>

  <!-- Topic-specific response -->
  <topic name="CATS">
    <category>
      <pattern>DO YOU LIKE THEM</pattern>
      <template>Yes! Cats are wonderful.</template>
    </category>
  </topic>

  <!-- Random response -->
  <category>
    <pattern>TELL ME A JOKE</pattern>
    <template>
      <random>
        <li>Why did the robot go on a diet? It had too many bytes!</li>
        <li>What do you call a sleeping dinosaur? A dino-snore!</li>
        <li>Why don't scientists trust atoms? Because they make up everything!</li>
      </random>
    </template>
  </category>

</aiml>`;

// ─── 2. Create and load the bot ──────────────────────────────────────────────

async function main() {
  const bot = new AIML1Bot({
    properties: {
      name: 'Alice',
      version: '1.0',
    },
  });

  await bot.loadXMLString(AIML, 'example.aiml');
  console.log(`Loaded ${bot.categoryCount} categories.\n`);

  // ─── 3. Simple one-shot conversation (default session) ──────────────────

  const r1 = await bot.talk('hello');
  console.log('User: hello');
  console.log(`Bot:  ${r1.response}\n`);

  // ─── 4. Multi-turn conversation with a named session ────────────────────

  const SID = 'demo-user';

  const turns = [
    'my name is Bob',
    'what is my name',
    'talk about cats',
    'do you like them',
    'say hello world',
    'tell me a joke',
  ];

  for (const input of turns) {
    const { response } = await bot.talk(input, SID);
    console.log(`User: ${input}`);
    console.log(`Bot:  ${response.trim()}\n`);
  }

  // ─── 5. Session serialisation ────────────────────────────────────────────

  const saved = bot.serializeSession(SID);
  console.log('--- Session serialised ---');
  console.log(saved.slice(0, 120) + '…\n');

  // Create a fresh bot and restore the session
  const bot2 = new AIML1Bot({ properties: { name: 'Alice' } });
  await bot2.loadXMLString(AIML, 'example.aiml');
  const restoredId = bot2.loadSerializedSession(saved);

  const r2 = await bot2.talk('what is my name', restoredId);
  console.log('--- Session restored in new bot ---');
  console.log(`User: what is my name`);
  console.log(`Bot:  ${r2.response.trim()}`);
}

main().catch(console.error);
