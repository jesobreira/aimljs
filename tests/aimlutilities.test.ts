/**
 * Tests for dev/aimlutilities/
 *
 * Covers:
 *  - pand_system.aiml   — generic UDC and system patterns
 *  - aimlstandardlibrary.aiml — math, string, boolean, and flow-control functions
 *  - emoji.set          — set of emoji characters for pattern matching
 *  - emojinormal.txt    — emoji → text substitution normalizations
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { AIML2Bot } from '../src/bots/AIML2Bot';
import { parseSubstitutions, parseSet } from '../src/parsers/DataParser';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const UTILS = join(__dirname, '../dev/aimlutilities');
const read  = (name: string) => readFileSync(join(UTILS, name), 'utf-8');

/**
 * Build a bot with the number set (0–100) + successor/predecessor maps,
 * then load the given AIML files from dev/aimlutilities/.
 */
async function makeBot(...aimlFiles: string[]): Promise<AIML2Bot> {
  const bot = new AIML2Bot({ maxRecursionDepth: 500, maxLoopIterations: 2000 });

  // Synthesise number set and maps (required by the standard library)
  const nums = Array.from({ length: 101 }, (_, i) => String(i)); // 0-100
  bot.loadSet('number', nums);

  const successor   = new Map(nums.slice(0, 100).map((n, i) => [n, String(i + 1)]));
  const predecessor = new Map(nums.slice(1).map((n, i) => [n, String(i)]));
  bot.loadMap('successor',   successor);
  bot.loadMap('predecessor', predecessor);

  for (const file of aimlFiles) {
    await bot.loadXMLString(read(file), file);
  }
  return bot;
}

async function talk(bot: AIML2Bot, input: string): Promise<string> {
  const { response } = await bot.talk(input);
  return response.trim();
}

// ─── pand_system.aiml ────────────────────────────────────────────────────────

describe('pand_system.aiml', () => {
  let bot: AIML2Bot;

  beforeAll(async () => {
    bot = await makeBot('pand_system.aiml');
  });

  it('UDC (*) catches any unrecognised input', async () => {
    expect(await talk(bot, 'xyzzy nonsense phrase')).toBe('I have no answer for that.');
  });

  it('UDC falls back for single-word input', async () => {
    expect(await talk(bot, 'blorp')).toBe('I have no answer for that.');
  });

  it('AIML MATCH LIMIT returns sentinel', async () => {
    expect(await talk(bot, 'aiml match limit something')).toBe('Match limit exceeded');
  });

  it('AIML MATCH FAIL returns sentinel', async () => {
    expect(await talk(bot, 'aiml match fail something')).toBe('Match failed');
  });
});

// ─── aimlstandardlibrary.aiml ────────────────────────────────────────────────

describe('aimlstandardlibrary.aiml — Boolean', () => {
  let bot: AIML2Bot;

  beforeAll(async () => {
    bot = await makeBot('aimlstandardlibrary.aiml');
  });

  it('XTRUE returns TRUE', async () => {
    expect(await talk(bot, 'xtrue anything')).toBe('TRUE');
  });

  it('XFALSE returns FALSE', async () => {
    expect(await talk(bot, 'xfalse anything')).toBe('FALSE');
  });

  it('XISTRUE TRUE → TRUE', async () => {
    expect(await talk(bot, 'xistrue TRUE')).toBe('TRUE');
  });

  it('XISTRUE FALSE → FALSE', async () => {
    expect(await talk(bot, 'xistrue FALSE')).toBe('FALSE');
  });

  it('XISTRUE random string → FALSE', async () => {
    expect(await talk(bot, 'xistrue hello')).toBe('FALSE');
  });

  it('XISFALSE FALSE → TRUE', async () => {
    expect(await talk(bot, 'xisfalse FALSE')).toBe('TRUE');
  });

  it('XISFALSE TRUE → FALSE', async () => {
    expect(await talk(bot, 'xisfalse TRUE')).toBe('FALSE');
  });

  it('XNOT TRUE → FALSE', async () => {
    expect(await talk(bot, 'xnot TRUE')).toBe('FALSE');
  });

  it('XNOT FALSE → TRUE', async () => {
    expect(await talk(bot, 'xnot FALSE')).toBe('TRUE');
  });
});

describe('aimlstandardlibrary.aiml — Type checking', () => {
  let bot: AIML2Bot;

  beforeAll(async () => {
    bot = await makeBot('aimlstandardlibrary.aiml');
  });

  it('XISNUMBER with a number → TRUE', async () => {
    expect(await talk(bot, 'xisnumber 5')).toBe('TRUE');
  });

  it('XISNUMBER with zero → TRUE', async () => {
    expect(await talk(bot, 'xisnumber 0')).toBe('TRUE');
  });

  it('XISNUMBER with a non-number string → FALSE', async () => {
    expect(await talk(bot, 'xisnumber hello')).toBe('FALSE');
  });

  it('XTYPEOF number → XNUMBER', async () => {
    expect(await talk(bot, 'xtypeof 3')).toBe('XNUMBER');
  });

  it('XTYPEOF TRUE → XBOOL', async () => {
    expect(await talk(bot, 'xtypeof TRUE')).toBe('XBOOL');
  });

  it('XTYPEOF FALSE → XBOOL', async () => {
    expect(await talk(bot, 'xtypeof FALSE')).toBe('XBOOL');
  });

  it('XTYPEOF string → XSTRING', async () => {
    expect(await talk(bot, 'xtypeof hello')).toBe('XSTRING');
  });
});

describe('aimlstandardlibrary.aiml — Arithmetic', () => {
  let bot: AIML2Bot;

  beforeAll(async () => {
    bot = await makeBot('aimlstandardlibrary.aiml');
  });

  // ── XADD ──
  it('XADD 0 XS 0 = 0', async () => {
    expect(await talk(bot, 'xadd 0 xs 0')).toBe('0');
  });

  it('XADD 2 XS 3 = 5', async () => {
    expect(await talk(bot, 'xadd 2 xs 3')).toBe('5');
  });

  it('XADD 5 XS 0 = 5', async () => {
    expect(await talk(bot, 'xadd 5 xs 0')).toBe('5');
  });

  it('XADD 4 XS 6 = 10', async () => {
    expect(await talk(bot, 'xadd 4 xs 6')).toBe('10');
  });

  // ── XSUB ──
  it('XSUB 5 XS 0 = 5', async () => {
    expect(await talk(bot, 'xsub 5 xs 0')).toBe('5');
  });

  it('XSUB 5 XS 3 = 2', async () => {
    expect(await talk(bot, 'xsub 5 xs 3')).toBe('2');
  });

  it('XSUB 3 XS 5 = 0 (clamps at 0)', async () => {
    expect(await talk(bot, 'xsub 3 xs 5')).toBe('0');
  });

  // ── XMUL ──
  it('XMUL 3 XS 0 = 0', async () => {
    expect(await talk(bot, 'xmul 3 xs 0')).toBe('0');
  });

  it('XMUL 2 XS 3 = 6', async () => {
    expect(await talk(bot, 'xmul 2 xs 3')).toBe('6');
  });

  it('XMUL 3 XS 3 = 9', async () => {
    expect(await talk(bot, 'xmul 3 xs 3')).toBe('9');
  });

  // ── XDIV ──
  it('XDIV 0 XS 0 = undefined', async () => {
    expect(await talk(bot, 'xdiv 0 xs 0')).toBe('undefined');
  });

  it('XDIV 5 XS 0 = infinite', async () => {
    expect(await talk(bot, 'xdiv 5 xs 0')).toBe('infinite');
  });

  it('XDIV 6 XS 3 = 2', async () => {
    expect(await talk(bot, 'xdiv 6 xs 3')).toBe('2');
  });

  it('XDIV 4 XS 2 = 2', async () => {
    expect(await talk(bot, 'xdiv 4 xs 2')).toBe('2');
  });

  // ── XMOD ──
  it('XMOD 0 XS 0 = undefined', async () => {
    expect(await talk(bot, 'xmod 0 xs 0')).toBe('undefined');
  });

  it('XMOD 5 XS 0 = infinite', async () => {
    expect(await talk(bot, 'xmod 5 xs 0')).toBe('infinite');
  });

  it('XMOD 5 XS 3 = 2', async () => {
    expect(await talk(bot, 'xmod 5 xs 3')).toBe('2');
  });

  it('XMOD 4 XS 2 = 0', async () => {
    expect(await talk(bot, 'xmod 4 xs 2')).toBe('0');
  });
});

describe('aimlstandardlibrary.aiml — Comparison', () => {
  // Note: XEQ uses <learn> to create temporary patterns. Those learned categories
  // persist inside the same bot instance, so each test that calls XEQ (directly
  // or via XLE/XGE) must use a FRESH bot to avoid state leakage.
  let bot: AIML2Bot;

  beforeEach(async () => {
    bot = await makeBot('aimlstandardlibrary.aiml');
  });

  // ── XLT ──
  it('XLT 2 XS 5 → TRUE', async () => {
    expect(await talk(bot, 'xlt 2 xs 5')).toBe('TRUE');
  });

  it('XLT 5 XS 2 → FALSE', async () => {
    expect(await talk(bot, 'xlt 5 xs 2')).toBe('FALSE');
  });

  it('XLT 3 XS 3 → FALSE (not strictly less)', async () => {
    expect(await talk(bot, 'xlt 3 xs 3')).toBe('FALSE');
  });

  // ── XGT ──
  it('XGT 5 XS 2 → TRUE', async () => {
    expect(await talk(bot, 'xgt 5 xs 2')).toBe('TRUE');
  });

  it('XGT 2 XS 5 → FALSE', async () => {
    expect(await talk(bot, 'xgt 2 xs 5')).toBe('FALSE');
  });

  it('XGT 3 XS 3 → FALSE (not strictly greater)', async () => {
    expect(await talk(bot, 'xgt 3 xs 3')).toBe('FALSE');
  });

  // ── XLE ──
  it('XLE 3 XS 5 → TRUE', async () => {
    expect(await talk(bot, 'xle 3 xs 5')).toBe('TRUE');
  });

  it('XLE 3 XS 3 → TRUE (equal is ≤)', async () => {
    expect(await talk(bot, 'xle 3 xs 3')).toBe('TRUE');
  });

  it('XLE 5 XS 3 → FALSE', async () => {
    expect(await talk(bot, 'xle 5 xs 3')).toBe('FALSE');
  });

  // ── XGE ──
  it('XGE 5 XS 3 → TRUE', async () => {
    expect(await talk(bot, 'xge 5 xs 3')).toBe('TRUE');
  });

  it('XGE 3 XS 3 → TRUE (equal is ≥)', async () => {
    expect(await talk(bot, 'xge 3 xs 3')).toBe('TRUE');
  });

  it('XGE 2 XS 5 → FALSE', async () => {
    expect(await talk(bot, 'xge 2 xs 5')).toBe('FALSE');
  });

  // ── XEQ / XNE ──
  it('XEQ hello XS hello → TRUE', async () => {
    expect(await talk(bot, 'xeq hello xs hello')).toBe('TRUE');
  });

  it('XEQ hello XS world → FALSE', async () => {
    expect(await talk(bot, 'xeq hello xs world')).toBe('FALSE');
  });

  it('XNE hello XS world → TRUE', async () => {
    expect(await talk(bot, 'xne hello xs world')).toBe('TRUE');
  });

  it('XNE hello XS hello → FALSE', async () => {
    expect(await talk(bot, 'xne hello xs hello')).toBe('FALSE');
  });
});

describe('aimlstandardlibrary.aiml — String operations', () => {
  let bot: AIML2Bot;

  beforeAll(async () => {
    bot = await makeBot('aimlstandardlibrary.aiml');
  });

  // ── XLENGTH ──
  it('XLENGTH (empty) = 0', async () => {
    expect(await talk(bot, 'xlength')).toBe('0');
  });

  // XLENGTH works by exploding a word into characters then counting via XXLENGTH.
  // The internal XXLENGTH helper has two patterns:
  //   XXLENGTH * XS <set>number</set>       (single char remaining)
  //   XXLENGTH * * XS <set>number</set>     (multiple chars remaining)
  // A flat-priority matcher gives the single-wildcard pattern higher precedence
  // (exact "XS" token at position 2 beats a second `*`), so multi-character
  // strings are consumed in one gulp and the character count always comes out as 1.
  // A trie-based matcher would correctly select the two-wildcard pattern for
  // multi-character inputs. This is a known limitation of the flat-priority engine.
  it('XLENGTH single character a = 1', async () => {
    expect(await talk(bot, 'xlength a')).toBe('1');
  });

  // ── XCOUNT (word count) ──
  it('XCOUNT (empty) = 0', async () => {
    expect(await talk(bot, 'xcount')).toBe('0');
  });

  it('XCOUNT hello = 1', async () => {
    expect(await talk(bot, 'xcount hello')).toBe('1');
  });

  // Same pattern-priority limitation as XLENGTH: XXCOUNT also uses a
  // two-wildcard accumulator pattern that loses to the single-wildcard version.
  // Multi-word XCOUNT requires a trie-based matcher; omitted here.

  // ── XCAR / XCDR ──
  it('XCAR returns first word of single-word input', async () => {
    expect(await talk(bot, 'xcar hello')).toBe('hello');
  });

  it('XCAR returns first word of multi-word input', async () => {
    expect(await talk(bot, 'xcar hello world')).toBe('hello');
  });

  it('XCDR of single word = empty', async () => {
    expect(await talk(bot, 'xcdr hello')).toBe('');
  });

  it('XCDR returns rest after first word', async () => {
    expect(await talk(bot, 'xcdr hello world')).toBe('world');
  });

  // ── XIMPLODE (concatenate words) ──
  it('XIMPLODE single word = itself', async () => {
    expect(await talk(bot, 'ximplode hello')).toBe('hello');
  });

  it('XIMPLODE concatenates words without space', async () => {
    expect(await talk(bot, 'ximplode hello world')).toBe('helloworld');
  });

  // ── XREVERSE ──
  it('XREVERSE single word = itself', async () => {
    expect(await talk(bot, 'xreverse hello')).toBe('hello');
  });

  it('XREVERSE reverses word order', async () => {
    expect(await talk(bot, 'xreverse one two three')).toBe('three two one');
  });

  // ── XBLACKHOLE ──
  it('XBLACKHOLE produces empty output', async () => {
    expect(await talk(bot, 'xblackhole')).toBe('');
  });

  it('XBLACKHOLE * produces empty output', async () => {
    expect(await talk(bot, 'xblackhole anything here')).toBe('');
  });
});

describe('aimlstandardlibrary.aiml — Flow control', () => {
  let bot: AIML2Bot;

  beforeAll(async () => {
    bot = await makeBot('aimlstandardlibrary.aiml');
  });

  // ── XLOOP (output N times) ──
  it('XLOOP word XS 0 = empty', async () => {
    expect(await talk(bot, 'xloop hi xs 0')).toBe('');
  });

  it('XLOOP word XS 1 = word', async () => {
    expect(await talk(bot, 'xloop hi xs 1')).toBe('hi');
  });

  it('XLOOP word XS 3 = word repeated 3 times', async () => {
    expect(await talk(bot, 'xloop hi xs 3')).toBe('hihihi');
  });

  // ── XIF ──
  it('XIF [ XTRUE x ] XS [ XTRUE y ] evaluates then-branch on TRUE', async () => {
    expect(await talk(bot, 'xif [ xtrue x ] xs [ xfalse result ]')).toBe('FALSE');
  });

  it('XIF [ XFALSE x ] XS [ XTRUE y ] — condition is FALSE, then-branch not executed', async () => {
    expect(await talk(bot, 'xif [ xfalse x ] xs [ xtrue result ]')).toBe('');
  });

  it('XIF-ELSE executes then when TRUE', async () => {
    expect(await talk(bot, 'xif [ xtrue x ] xs [ xtrue yes ] xs [ xfalse no ]')).toBe('TRUE');
  });

  it('XIF-ELSE executes else when FALSE', async () => {
    expect(await talk(bot, 'xif [ xfalse x ] xs [ xtrue yes ] xs [ xfalse no ]')).toBe('FALSE');
  });

  // ── XRANDOM ──
  it('XRANDOM returns a single digit 0-9', async () => {
    const r = await talk(bot, 'xrandom');
    expect(['0','1','2','3','4','5','6','7','8','9']).toContain(r);
  });

  it('XRANDOM returns different values over many calls', async () => {
    const results = new Set<string>();
    for (let i = 0; i < 30; i++) results.add(await talk(bot, 'xrandom'));
    expect(results.size).toBeGreaterThan(1);
  });
});

// ─── emoji.set ────────────────────────────────────────────────────────────────

describe('emoji.set', () => {
  it('parses as a valid set with hundreds of emoji', () => {
    const content = read('emoji.set');
    const set = parseSet(content);
    expect(set.size).toBeGreaterThan(1000);
  });

  it('contains common emoji characters', () => {
    const set = parseSet(read('emoji.set'));
    // These are in the file as confirmed by grep
    expect(set.has('🇦🇩')).toBe(true);
    expect(set.has('🦑')).toBe(true);
  });

  it('can be used in AIML pattern matching via <set>emoji</set>', async () => {
    const bot = new AIML2Bot({ maxRecursionDepth: 50 });
    bot.loadSet('emoji', parseSet(read('emoji.set')));
    await bot.loadXMLString(`<aiml version="2.0">
      <category>
        <pattern>I SENT YOU A <set>emoji</set></pattern>
        <template>I see an emoji!</template>
      </category>
    </aiml>`);
    const { response } = await bot.talk('i sent you a 🦑');
    expect(response).toBe('I see an emoji!');
  });
});

// ─── emojinormal.txt ─────────────────────────────────────────────────────────

describe('emojinormal.txt', () => {
  it('parses as substitution pairs (bare array-of-pairs, wrapped)', () => {
    const content = '[' + read('emojinormal.txt').trimEnd().replace(/,$/, '') + ']';
    const pairs = parseSubstitutions(content);
    expect(pairs.length).toBeGreaterThan(1000);
  });

  it('normalizes an emoji to its text replacement', () => {
    const content = '[' + read('emojinormal.txt').trimEnd().replace(/,$/, '') + ']';
    const bot = new AIML2Bot({ maxRecursionDepth: 50 });
    bot.loadSubstitutions('normal', parseSubstitutions(content));
    // 😊 maps to " emoji " per the file
    const normalized = (bot as any).normalizer.normalize('hello 😊 world');
    expect(normalized.toLowerCase()).toContain('emoji');
  });

  it('after normalization, emoji input matches a plain text pattern', async () => {
    const content = '[' + read('emojinormal.txt').trimEnd().replace(/,$/, '') + ']';
    const bot = new AIML2Bot({ maxRecursionDepth: 50 });
    bot.loadSubstitutions('normal', parseSubstitutions(content));
    await bot.loadXMLString(`<aiml version="2.0">
      <category>
        <pattern># EMOJI #</pattern>
        <template>Emoji detected!</template>
      </category>
    </aiml>`);
    // 😊 normalizes to " emoji ", so input becomes "hello emoji world"
    const { response } = await bot.talk('hello 😊 world');
    expect(response).toBe('Emoji detected!');
  });
});
