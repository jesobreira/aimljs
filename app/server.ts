#!/usr/bin/env npx tsx
/**
 * AIML Chat Web App — Express server
 *
 * Usage:
 *   npm run app
 *   PORT=4000 npm run app
 */

import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readdir, readFile } from 'fs/promises';
import { extname, basename } from 'path';
import {
  AIML2Bot,
  parseProperties,
  parseSubstitutions,
  parseSet,
  parseMap,
} from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── Bot definitions ──────────────────────────────────────────────────────────

export const BOT_DEFS = [
  { id: 'rosie',       label: 'Rosie',      description: 'Pandorabots AIML 2.0 — conversational & knowledgeable' },
  { id: 'freeaiml',   label: 'Free-AIML',  description: 'Pandorabots Free-AIML — games, jokes, trivia' },
  { id: 'squarebear', label: 'Squarebear', description: 'Extended Free-AIML — more games & wordplay' },
  { id: 'alice',      label: 'ALICE',       description: 'Classic ALICE by Dr. Wallace — 100K+ categories' },
] as const;

export type BotId = typeof BOT_DEFS[number]['id'];

// ─── File loading helpers ─────────────────────────────────────────────────────

async function loadDir(dir: string) {
  const r: Array<{ name: string; content: string }> = [];
  try {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      if (!e.isFile()) continue;
      r.push({ name: basename(e.name, extname(e.name)), content: await readFile(join(dir, e.name), 'utf-8') });
    }
  } catch { /* skip missing */ }
  return r;
}

async function readAllAiml(dir: string): Promise<Array<{ name: string; content: string }>> {
  const files: Array<{ name: string; content: string }> = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && extname(e.name).toLowerCase() === '.aiml') {
        files.push({ name: join(dir, e.name), content: await readFile(join(dir, e.name), 'utf-8') });
      }
    }
  } catch { /* skip missing */ }
  return files;
}

// ─── Pre-load raw file content at startup (fast — just disk reads) ────────────

interface BotAssets {
  aimlFiles: Array<{ name: string; content: string; lenient?: boolean }>;
  /** Rosie-only setup function (properties, sets, maps, substitutions) */
  setup?: (bot: AIML2Bot) => Promise<void>;
}

const botAssets: Record<BotId, BotAssets> = {} as any;

async function preloadAssets() {
  const ROSIE       = join(ROOT, 'dev/rosie');
  const FREE        = join(ROOT, 'dev/freeaiml');
  const SQUAREBEAR  = join(ROOT, 'dev/squarebear');
  const ALICE       = join(ROOT, 'dev/alice');

  // Rosie data (properties, substitutions, sets, maps)
  const rosieSystemFiles    = await loadDir(join(ROSIE, 'system'));
  const rosieSubFiles       = await loadDir(join(ROSIE, 'substitutions'));
  const rosieSetFiles       = await loadDir(join(ROSIE, 'sets'));
  const rosieMapFiles       = await loadDir(join(ROSIE, 'maps'));

  botAssets.rosie = {
    aimlFiles: await readAllAiml(join(ROSIE, 'aiml')),
    setup: async (bot) => {
      const subTypes: Record<string, 'normal'|'person'|'person2'|'gender'|'denormal'> = {
        normal:'normal', person:'person', person2:'person2', gender:'gender', denormal:'denormal',
      };
      for (const { content } of rosieSystemFiles) bot.loadProperties(parseProperties(content));
      for (const { name, content } of rosieSubFiles) {
        const t = subTypes[name.toLowerCase()]; if (t) bot.loadSubstitutions(t, parseSubstitutions(content));
      }
      for (const { name, content } of rosieSetFiles)  bot.loadSet(name, parseSet(content));
      for (const { name, content } of rosieMapFiles)  bot.loadMap(name, parseMap(content));

      // Synthesise missing number/successor/predecessor maps
      const allMaps = (bot as any).maps as Map<string, Map<string, string>>;
      const n2n = allMaps.get('number2name'), nm2n = allMaps.get('name2number');
      const numSet = new Set<string>();
      if (n2n)  for (const k of n2n.keys())  numSet.add(k);
      if (nm2n) for (const k of nm2n.keys()) numSet.add(k);
      if (numSet.size) bot.loadSet('number', numSet);
      if (n2n) {
        const nums = [...n2n.keys()].map(Number).filter(n => !Number.isNaN(n)).sort((a, b) => a - b);
        const succ = new Map<string, string>(), pred = new Map<string, string>();
        for (const n of nums) { succ.set(String(n), String(n + 1)); if (n > 0) pred.set(String(n), String(n - 1)); }
        bot.loadMap('successor', succ);
        bot.loadMap('predecessor', pred);
      }
    },
  };

  botAssets.freeaiml   = { aimlFiles: await readAllAiml(FREE) };
  botAssets.squarebear = { aimlFiles: await readAllAiml(SQUAREBEAR) };
  botAssets.alice      = { aimlFiles: (await readAllAiml(ALICE)).map(f => ({ ...f, lenient: true })) };
}

// ─── Combined bot cache ───────────────────────────────────────────────────────

const botCache = new Map<string, { bot: AIML2Bot; categories: number }>();
// Track which bot key each session is using
const sessionBotKey = new Map<string, string>();

function makeBotKey(bots: BotId[]): string {
  return [...bots].sort().join('+') || 'rosie+freeaiml+squarebear+alice';
}

async function getOrCreateBot(bots: BotId[]): Promise<{ bot: AIML2Bot; categories: number }> {
  const key = makeBotKey(bots);
  if (botCache.has(key)) return botCache.get(key)!;

  const bot = new AIML2Bot({ maxRecursionDepth: 200, properties: { name: 'Alice' } });

  // Run Rosie setup first if rosie is selected (data is shared regardless)
  if (bots.includes('rosie') && botAssets.rosie.setup) {
    await botAssets.rosie.setup(bot);
  }

  // Load AIML files for each selected bot (in a consistent order)
  const ORDER: BotId[] = ['rosie', 'freeaiml', 'squarebear', 'alice'];
  for (const id of ORDER) {
    if (!bots.includes(id)) continue;
    const assets = botAssets[id];
    for (const { name, content, lenient } of assets.aimlFiles) {
      await bot.loadXMLString(content, name, lenient ?? false);
    }
  }

  bot.setProperty('name', 'Alice');
  const entry = { bot, categories: bot.categoryCount };
  botCache.set(key, entry);
  return entry;
}

// ─── Bot category counts (per individual bot) ─────────────────────────────────

const botCounts: Record<string, number> = {};

async function measureBotCounts() {
  for (const def of BOT_DEFS) {
    const assets = botAssets[def.id];
    let count = 0;
    for (const { content } of assets.aimlFiles) {
      const matches = content.match(/<category>/gi);
      count += matches?.length ?? 0;
    }
    botCounts[def.id] = count;
  }
}

// ─── Express app ─────────────────────────────────────────────────────────────

const app  = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// GET /api/bots — available bots and their category counts
app.get('/api/bots', (_req, res) => {
  res.json(BOT_DEFS.map(def => ({
    id:          def.id,
    label:       def.label,
    description: def.description,
    categories:  botCounts[def.id] ?? 0,
  })));
});

// POST /api/chat
// Body: { message, sessionId?, bots?: BotId[] }
app.post('/api/chat', async (req, res) => {
  const { message, sessionId, bots } = req.body as {
    message: string;
    sessionId?: string;
    bots?: BotId[];
  };

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  const selectedBots: BotId[] = (bots && bots.length > 0)
    ? bots.filter(b => BOT_DEFS.some(d => d.id === b))
    : (BOT_DEFS.map(d => d.id) as BotId[]);

  const sid = sessionId ?? `session-${Date.now()}`;

  // On first message for a session, record which bot config it uses
  if (!sessionBotKey.has(sid)) {
    sessionBotKey.set(sid, makeBotKey(selectedBots));
  }

  const key = sessionBotKey.get(sid)!;

  try {
    // Get or create the combined bot for this configuration
    const cachedBots = [...botCache.keys()];
    if (!cachedBots.includes(key)) {
      console.log(`  Building bot combination: ${key}…`);
    }
    const { bot } = await getOrCreateBot(selectedBots);

    const result = await bot.talk(message.trim(), sid);
    res.json({
      response:   result.response || "(I'm not sure how to respond to that.)",
      sessionId:  sid,
      categories: bot.categoryCount,
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// DELETE /api/session/:id
app.delete('/api/session/:id', async (req, res) => {
  const sid = req.params.id;
  const key = sessionBotKey.get(sid);
  if (key) {
    const cached = botCache.get(key);
    if (cached) cached.bot.deleteSession(sid);
    sessionBotKey.delete(sid);
  }
  res.json({ deleted: true });
});

// GET /api/status
app.get('/api/status', (_req, res) => {
  const counts = Object.fromEntries(
    [...botCache.entries()].map(([k, v]) => [k, v.categories]),
  );
  res.json({ name: 'Alice', botCombinations: counts });
});

// ─── Boot ─────────────────────────────────────────────────────────────────────

(async () => {
  console.log('🤖 Pre-loading AIML assets…');
  const t0 = Date.now();

  await preloadAssets();
  await measureBotCounts();

  console.log(`✅ Assets ready in ${Date.now() - t0}ms — building default bot (all bots)…`);

  // Pre-load the "all bots" combination in the background so the first chat is instant
  const allBots = BOT_DEFS.map(d => d.id) as BotId[];
  getOrCreateBot(allBots).then(({ categories }) => {
    console.log(`✅ Default bot ready — ${categories.toLocaleString()} categories\n`);
  });

  app.listen(PORT, () => {
    console.log(`🌐 Open http://localhost:${PORT}\n`);
  });
})();
