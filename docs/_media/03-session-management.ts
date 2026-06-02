/**
 * Example 3 — Session management and serialisation
 *
 * Demonstrates:
 *  - Creating named sessions
 *  - Predicate persistence across turns
 *  - Session serialisation to JSON (for storage in DB / localStorage)
 *  - Restoring a session in a different bot instance
 *  - Serialising and restoring all sessions at once
 */

import { AIML1Bot, Session } from '../src';

const AIML = `<?xml version="1.0" encoding="UTF-8"?>
<aiml version="1.0">
  <category>
    <pattern>MY NAME IS *</pattern>
    <template><think><set name="username"><star/></set></think>Hello, <star/>!</template>
  </category>
  <category>
    <pattern>WHAT IS MY NAME</pattern>
    <template>You are <get name="username"/>.</template>
  </category>
  <category>
    <pattern>I AM * YEARS OLD</pattern>
    <template><think><set name="age"><star/></set></think>Got it — you are <star/> years old.</template>
  </category>
  <category>
    <pattern>TELL ME ABOUT ME</pattern>
    <template>You are <get name="username"/>, <get name="age"/> years old.</template>
  </category>
</aiml>`;

async function main() {
  const bot = new AIML1Bot({ properties: { name: 'Alice' } });
  await bot.loadXMLString(AIML, 'session-example.aiml');

  // ─── Simulate two concurrent users ───────────────────────────────────────

  console.log('=== User A conversation ===');
  await bot.talk('my name is Alice', 'user-a');
  await bot.talk('i am 30 years old', 'user-a');
  const rA = await bot.talk('tell me about me', 'user-a');
  console.log('Bot (user-a):', rA.response.trim(), '\n');

  console.log('=== User B conversation ===');
  await bot.talk('my name is Bob', 'user-b');
  await bot.talk('i am 25 years old', 'user-b');
  const rB = await bot.talk('tell me about me', 'user-b');
  console.log('Bot (user-b):', rB.response.trim(), '\n');

  // ─── Serialise a single session ──────────────────────────────────────────

  const sessionJsonA = bot.serializeSession('user-a');
  console.log('=== Serialised user-a session ===');
  console.log(sessionJsonA);
  console.log();

  // ─── Restore in a new bot instance ───────────────────────────────────────

  const bot2 = new AIML1Bot({ properties: { name: 'Alice' } });
  await bot2.loadXMLString(AIML, 'session-example.aiml');

  const restoredId = bot2.loadSerializedSession(sessionJsonA);
  const rRestored = await bot2.talk('what is my name', restoredId);
  console.log('=== Restored session in new bot ===');
  console.log(`Bot: ${rRestored.response.trim()}\n`);

  // ─── Use Session directly ────────────────────────────────────────────────

  const session = new Session('direct-session');
  session.setPredicate('name', 'Carol');
  session.setTopic('technology');
  session.addTurn('hello', 'Hi Carol!');

  console.log('=== Session object API ===');
  console.log('Topic:', session.getTopic());
  console.log('Name predicate:', session.getPredicate('name'));
  console.log('Last input:', session.getInput(1));
  console.log('Last response:', session.getResponse(1));

  // Serialise and deserialise
  const snap = session.serialize();
  const session2 = Session.deserialize(snap);
  console.log('\nRestored from snapshot:');
  console.log('  id:', session2.id);
  console.log('  name:', session2.getPredicate('name'));
  console.log('  topic:', session2.getTopic());

  // ─── Serialise all sessions at once ─────────────────────────────────────

  console.log('\n=== Serialise all sessions ===');
  const all = bot.serializeAllSessions();
  console.log(`Serialised ${JSON.parse(all).length} sessions.`);

  const bot3 = new AIML1Bot({ properties: { name: 'Alice' } });
  await bot3.loadXMLString(AIML, 'session-example.aiml');
  const ids = bot3.loadAllSerializedSessions(all);
  console.log('Restored session IDs:', ids);

  for (const id of ids) {
    const r = await bot3.talk('tell me about me', id);
    console.log(`  ${id}: ${r.response.trim()}`);
  }
}

main().catch(console.error);
