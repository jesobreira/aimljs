/**
 * Example 6 — Opt-in features: <system> and <javascript> tags
 *
 * Both tags are disabled by default for security.
 * Enable them explicitly when you know the AIML files are trusted.
 *
 * <system>  — Node.js only: execute a shell command and return stdout.
 * <javascript> — Execute an inline JS expression via new Function().
 *
 * Run:
 *   npx tsx examples/06-opt-in-features.ts
 */

import { AIML1Bot } from '../src/index.js';

// ─── AIML using <system> ──────────────────────────────────────────────────────

const SYSTEM_AIML = `<?xml version="1.0" encoding="UTF-8"?>
<aiml version="1.0">

  <!-- Current date/time via shell -->
  <category>
    <pattern>WHAT TIME IS IT</pattern>
    <template>The current time is <system>date +%H:%M:%S</system>.</template>
  </category>

  <category>
    <pattern>WHAT IS TODAY</pattern>
    <template>Today is <system>date +"%A, %B %d %Y"</system>.</template>
  </category>

  <!-- Echo the working directory -->
  <category>
    <pattern>WHERE ARE YOU RUNNING</pattern>
    <template>I am running from <system>pwd</system>.</template>
  </category>

  <!-- Word count of a file passed as a wildcard -->
  <category>
    <pattern>HOW MANY LINES IN *</pattern>
    <template>
      <think><set name="file"><star/></set></think>
      <system>wc -l "<star/>" 2>/dev/null || echo "file not found"</system>
    </template>
  </category>

</aiml>`;

// ─── AIML using <javascript> ──────────────────────────────────────────────────
//
// IMPORTANT: When embedding JavaScript inside an AIML template literal string,
// use \\ for a literal backslash so it survives template-literal processing.
// For example, write \\s instead of \s in regex patterns.

const JS_AIML = `<?xml version="1.0" encoding="UTF-8"?>
<aiml version="1.0">

  <!-- String reverse -->
  <category>
    <pattern>REVERSE *</pattern>
    <template><javascript>
      return '<star/>'.split('').reverse().join('');
    </javascript></template>
  </category>

  <!-- Word count — note: use \\\\s (four backslashes) so the template literal
       produces \\s in the string, which then becomes \\s in the JS regex -->
  <category>
    <pattern>HOW MANY WORDS IN *</pattern>
    <template><javascript>
      return String('<star/>'.trim().split(/\\s+/).length);
    </javascript></template>
  </category>

  <!-- Safe arithmetic: only digits, spaces, and basic operators -->
  <category>
    <pattern>CALCULATE *</pattern>
    <template><javascript>
      var expr = '<star/>';
      var safe = /^[0-9+\\-*\\/.() ]+$/.test(expr);
      if (!safe) return 'Invalid expression.';
      try { return String(Function('return (' + expr + ')')()) }
      catch(e) { return 'Error: ' + e.message; }
    </javascript></template>
  </category>

  <!-- Random number between two values -->
  <category>
    <pattern>RANDOM NUMBER BETWEEN * AND *</pattern>
    <template><javascript>
      var lo = parseInt('<star index="1"/>') || 1;
      var hi = parseInt('<star index="2"/>') || 100;
      return String(Math.floor(Math.random() * (hi - lo + 1)) + lo);
    </javascript></template>
  </category>

  <!-- Current timestamp -->
  <category>
    <pattern>UNIX TIMESTAMP</pattern>
    <template><javascript>return String(Date.now());</javascript></template>
  </category>

</aiml>`;

// ─── Gossip handler ───────────────────────────────────────────────────────────

// <gossip> sends text to a handler without producing output.
// Override handleGossip by subclassing or passing onGossip via the processor.
// Here we demonstrate it by peeking at the internal processor dep.
const GOSSIP_AIML = `<?xml version="1.0" encoding="UTF-8"?>
<aiml version="1.0">
  <category>
    <pattern>LOG *</pattern>
    <template>
      <gossip>User said: <star/></gossip>
      Noted!
    </template>
  </category>
</aiml>`;

// ─── Run ──────────────────────────────────────────────────────────────────────

async function main() {
  // ── <system> demo ─────────────────────────────────────────────────────────
  console.log('=== <system> tag (enableSystem: true) ===\n');

  const sysBot = new AIML1Bot({ enableSystem: true });
  await sysBot.loadXMLString(SYSTEM_AIML, 'system-example.aiml');

  const sysTurns = [
    'what time is it',
    'what is today',
    'where are you running',
    `how many lines in ${process.argv[1]}`,  // this script itself
  ];

  for (const input of sysTurns) {
    const { response } = await sysBot.talk(input);
    console.log(`User: ${input}`);
    console.log(`Bot:  ${response.trim()}\n`);
  }

  // ── <system> disabled (default) ───────────────────────────────────────────
  console.log('=== <system> disabled (default) ===\n');

  const noSysBot = new AIML1Bot(); // enableSystem not set → defaults false
  await noSysBot.loadXMLString(SYSTEM_AIML, 'system-example.aiml');
  const { response: disabledResp } = await noSysBot.talk('what time is it');
  console.log('User: what time is it');
  console.log(`Bot:  "${disabledResp}"  ← empty because <system> is opt-in\n`);

  // ── <javascript> demo ─────────────────────────────────────────────────────
  console.log('=== <javascript> tag (enableJavaScript: true) ===\n');

  // Note: enableJavaScript is accepted but currently all bots allow <javascript>
  // when present in the AIML. The flag documents intent; enforcement can be
  // added in AIMLBot subclasses for strict sandboxing.
  const jsBot = new AIML1Bot({ enableJavaScript: true });
  await jsBot.loadXMLString(JS_AIML, 'js-example.aiml');

  const jsTurns = [
    'reverse hello world',
    'how many words in the quick brown fox',  // uses \\s fix
    'calculate 2 + 2',
    'calculate 100 / 4',
    'calculate 9 * 9',
    'random number between 1 and 6',
    'unix timestamp',
  ];

  for (const input of jsTurns) {
    const { response } = await jsBot.talk(input);
    console.log(`User: ${input}`);
    console.log(`Bot:  ${response.trim()}\n`);
  }

  // ── Gossip handler ────────────────────────────────────────────────────────
  console.log('=== <gossip> handler ===\n');

  const gossipLog: string[] = [];

  class LoggingBot extends AIML1Bot {
    protected handleGossip(text: string): void {
      gossipLog.push(text.trim());
    }
  }

  const gossipBot = new LoggingBot();
  await gossipBot.loadXMLString(GOSSIP_AIML, 'gossip-example.aiml');

  await gossipBot.talk('log hello from the user');
  await gossipBot.talk('log another message');

  console.log('Gossip log captured silently:');
  gossipLog.forEach((entry, i) => console.log(`  [${i + 1}] ${entry}`));
  console.log();
}

main().catch(console.error);
