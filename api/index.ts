/**
 * Vercel serverless entry point.
 *
 * This file is the single API handler for the Vercel deployment.
 * It re-uses all the bot-loading logic from app/server.ts but:
 *  - Initialises the bot at module level (cached across warm invocations)
 *  - Exports the Express `app` as the default export (Vercel convention)
 *  - Never calls `app.listen()` — Vercel does that
 *
 * Environment variables
 * ─────────────────────
 * AIML_BOTS   Comma-separated list of bot IDs to load.
 *             Defaults to all four bots.
 *             Example: AIML_BOTS=rosie,freeaiml
 *             Use this to reduce cold-start time on Vercel Hobby plan.
 */

import express from 'express';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { readdir, readFile } from 'fs/promises';
import {
  AIML2Bot,
  parseProperties,
  parseSubstitutions,
  parseSet,
  parseMap,
} from '../src/index.js';

// In the Vercel bundle, __dirname is the api/ directory.
// The dev/ folder is bundled at the project root, so ROOT = one level up.
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = join(__dirname, '..');

// ─── Bot definitions ──────────────────────────────────────────────────────────

const BOT_DEFS = [
  { id: 'rosie',       label: 'Rosie',      description: 'Pandorabots AIML 2.0 — conversational & knowledgeable' },
  { id: 'freeaiml',   label: 'Free-AIML',  description: 'Pandorabots Free-AIML — games, jokes, trivia' },
  { id: 'squarebear', label: 'Squarebear', description: 'Extended Free-AIML — more games & wordplay' },
  { id: 'alice',      label: 'ALICE',       description: 'Classic ALICE by Dr. Wallace — 100K+ categories' },
] as const;

type BotId = typeof BOT_DEFS[number]['id'];

// ─── Determine which bots to load ─────────────────────────────────────────────
// AIML_BOTS=rosie,freeaiml  to limit bots on Hobby plan
const ENV_BOTS = process.env.AIML_BOTS;
const ENABLED_BOTS: BotId[] = ENV_BOTS
  ? (ENV_BOTS.split(',').map(s => s.trim()) as BotId[]).filter(id => BOT_DEFS.some(d => d.id === id))
  : (BOT_DEFS.map(d => d.id) as BotId[]);

// ─── File helpers ─────────────────────────────────────────────────────────────

async function loadDir(dir: string) {
  const r: Array<{ name: string; content: string }> = [];
  try {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      if (!e.isFile()) continue;
      r.push({ name: basename(e.name, extname(e.name)), content: await readFile(join(dir, e.name), 'utf-8') });
    }
  } catch { /* skip missing dirs */ }
  return r;
}

async function readAimlFiles(dir: string) {
  const files: Array<{ name: string; content: string }> = [];
  try {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      if (e.isFile() && extname(e.name).toLowerCase() === '.aiml')
        files.push({ name: join(dir, e.name), content: await readFile(join(dir, e.name), 'utf-8') });
    }
  } catch {}
  return files;
}

// ─── Bot initialisation — runs once at module load ────────────────────────────

const botCache    = new Map<string, { bot: AIML2Bot; categories: number }>();
const sessionBotKey = new Map<string, string>();
const botCounts: Record<string, number> = {};

interface BotAssets {
  aimlFiles: Array<{ name: string; content: string; lenient?: boolean }>;
  setup?: (bot: AIML2Bot) => Promise<void>;
}

async function buildAssets(): Promise<Record<string, BotAssets>> {
  const ROSIE      = join(ROOT, 'dev/rosie');
  const FREE       = join(ROOT, 'dev/freeaiml');
  const SQUAREBEAR = join(ROOT, 'dev/squarebear');
  const ALICE      = join(ROOT, 'dev/alice');

  const [sysFiles, subFiles, setFiles, mapFiles] = await Promise.all([
    loadDir(join(ROSIE, 'system')),
    loadDir(join(ROSIE, 'substitutions')),
    loadDir(join(ROSIE, 'sets')),
    loadDir(join(ROSIE, 'maps')),
  ]);

  return {
    rosie: {
      aimlFiles: await readAimlFiles(join(ROSIE, 'aiml')),
      setup: async (bot) => {
        const subTypes: Record<string, 'normal'|'person'|'person2'|'gender'|'denormal'> = {
          normal:'normal', person:'person', person2:'person2', gender:'gender', denormal:'denormal',
        };
        for (const { content } of sysFiles) bot.loadProperties(parseProperties(content));
        for (const { name, content } of subFiles) {
          const t = subTypes[name.toLowerCase()]; if (t) bot.loadSubstitutions(t, parseSubstitutions(content));
        }
        for (const { name, content } of setFiles) bot.loadSet(name, parseSet(content));
        for (const { name, content } of mapFiles) bot.loadMap(name, parseMap(content));

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
          bot.loadMap('successor', succ); bot.loadMap('predecessor', pred);
        }
      },
    },
    freeaiml:   { aimlFiles: await readAimlFiles(FREE) },
    squarebear: { aimlFiles: await readAimlFiles(SQUAREBEAR) },
    alice:      { aimlFiles: (await readAimlFiles(ALICE)).map(f => ({ ...f, lenient: true })) },
  };
}

function makeBotKey(bots: BotId[]): string {
  return [...bots].sort().join('+');
}

async function getOrCreateBot(
  assets: Record<string, BotAssets>,
  bots: BotId[],
): Promise<{ bot: AIML2Bot; categories: number }> {
  const key = makeBotKey(bots);
  if (botCache.has(key)) return botCache.get(key)!;

  const bot = new AIML2Bot({ maxRecursionDepth: 200, properties: { name: 'Alice' } });

  if (bots.includes('rosie') && assets.rosie.setup) await assets.rosie.setup(bot);

  const ORDER: BotId[] = ['rosie', 'freeaiml', 'squarebear', 'alice'];
  for (const id of ORDER) {
    if (!bots.includes(id)) continue;
    for (const { name, content, lenient } of assets[id].aimlFiles)
      await bot.loadXMLString(content, name, lenient ?? false);
  }

  bot.setProperty('name', 'Alice');
  const entry = { bot, categories: bot.categoryCount };
  botCache.set(key, entry);
  return entry;
}

// ─── Module-level initialisation (cached across warm invocations) ─────────────

const initPromise = (async () => {
  console.log(`[aiml.js] Loading bots: ${ENABLED_BOTS.join(', ')}…`);
  const t0 = Date.now();
  const assets = await buildAssets();

  // Count categories per bot for /api/bots endpoint
  for (const def of BOT_DEFS) {
    const a = assets[def.id];
    botCounts[def.id] = (a?.aimlFiles ?? []).reduce((s, f) => {
      return s + (f.content.match(/<category>/gi)?.length ?? 0);
    }, 0);
  }

  // Pre-load the default (enabled) bot combination
  const { categories } = await getOrCreateBot(assets, ENABLED_BOTS);
  console.log(`[aiml.js] Ready — ${categories.toLocaleString()} categories in ${Date.now() - t0}ms`);
  return assets;
})();

// ─── Express app ──────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// Middleware: wait for bot init before processing any request
app.use(async (_req, _res, next) => {
  await initPromise;
  next();
});

// GET /api/bots
app.get('/api/bots', (_req, res) => {
  res.json(BOT_DEFS.map(def => ({
    id:          def.id,
    label:       def.label,
    description: def.description,
    categories:  botCounts[def.id] ?? 0,
    enabled:     ENABLED_BOTS.includes(def.id),
  })));
});

// POST /api/chat
app.post('/api/chat', async (req, res) => {
  const { message, sessionId, bots } = req.body as {
    message?: string;
    sessionId?: string;
    bots?: BotId[];
  };

  if (!message || typeof message !== 'string')
    return res.status(400).json({ error: 'message is required' });

  const assets = await initPromise;

  // Only allow bots that are enabled on this deployment
  const requested: BotId[] = (bots && bots.length > 0)
    ? bots.filter(b => ENABLED_BOTS.includes(b))
    : ENABLED_BOTS;
  const effective = requested.length > 0 ? requested : ENABLED_BOTS;

  const sid = sessionId ?? `s-${Date.now()}`;
  if (!sessionBotKey.has(sid)) sessionBotKey.set(sid, makeBotKey(effective));

  const key = sessionBotKey.get(sid)!;
  const botsForKey = key.split('+') as BotId[];

  try {
    const { bot } = await getOrCreateBot(assets, botsForKey);
    const result = await bot.talk(message.trim(), sid);
    res.json({
      response:  result.response || "(I'm not sure how to respond to that.)",
      sessionId: sid,
    });
  } catch (err) {
    console.error('[aiml.js] Chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
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
  res.json({
    name:        'Alice',
    enabledBots: ENABLED_BOTS,
    combinations: [...botCache.entries()].map(([k, v]) => ({ key: k, categories: v.categories })),
  });
});

// Default export for Vercel
export default app;
