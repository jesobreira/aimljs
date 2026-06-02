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

// ─── Bot initialisation ───────────────────────────────────────────────────────

async function loadDir(dir: string) {
  const r: Array<{ name: string; content: string }> = [];
  try {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      if (!e.isFile()) continue;
      r.push({
        name: basename(e.name, extname(e.name)),
        content: await readFile(join(dir, e.name), 'utf-8'),
      });
    }
  } catch { /* skip missing dirs */ }
  return r;
}

async function createBot(): Promise<AIML2Bot> {
  console.log('🤖 Loading AIML knowledge base…');
  const t0 = Date.now();

  const bot = new AIML2Bot({
    properties: {
      name: 'Alice',
      version: '2.0',
      botmaster: 'Pandorabots',
    },
    maxRecursionDepth: 200,
  });

  const ROSIE = join(ROOT, 'dev/rosie');
  const FREE  = join(ROOT, 'dev/freeaiml');

  // ── Rosie: properties, substitutions, sets, maps ──────────────────────────
  for (const { content } of await loadDir(join(ROSIE, 'system'))) {
    bot.loadProperties(parseProperties(content));
  }

  const subTypes: Record<string, 'normal'|'person'|'person2'|'gender'|'denormal'> = {
    normal: 'normal', person: 'person', person2: 'person2',
    gender: 'gender', denormal: 'denormal',
  };
  for (const { name, content } of await loadDir(join(ROSIE, 'substitutions'))) {
    const t = subTypes[name.toLowerCase()];
    if (t) bot.loadSubstitutions(t, parseSubstitutions(content));
  }
  for (const { name, content } of await loadDir(join(ROSIE, 'sets')))
    bot.loadSet(name, parseSet(content));
  for (const { name, content } of await loadDir(join(ROSIE, 'maps')))
    bot.loadMap(name, parseMap(content));

  // ── Synthesise missing Rosie data ─────────────────────────────────────────
  const allMaps = (bot as any).maps as Map<string, Map<string, string>>;
  const number2name = allMaps.get('number2name');
  const name2number = allMaps.get('name2number');
  const numberSet = new Set<string>();
  if (number2name) for (const k of number2name.keys()) numberSet.add(k);
  if (name2number) for (const k of name2number.keys()) numberSet.add(k);
  if (numberSet.size) bot.loadSet('number', numberSet);

  if (number2name) {
    const nums = [...number2name.keys()]
      .map(Number).filter(n => !Number.isNaN(n)).sort((a, b) => a - b);
    const successor   = new Map<string, string>();
    const predecessor = new Map<string, string>();
    for (const n of nums) {
      successor.set(String(n), String(n + 1));
      if (n > 0) predecessor.set(String(n), String(n - 1));
    }
    bot.loadMap('successor', successor);
    bot.loadMap('predecessor', predecessor);
  }

  // Override bot name after loading Rosie properties
  bot.setProperty('name', 'Alice');

  // ── Load AIML files: Rosie first, then FreeAIML ───────────────────────────
  await bot.loadDirectory(join(ROSIE, 'aiml'), false, ['.aiml']);
  await bot.loadDirectory(FREE, false, ['.aiml']);

  console.log(`✅ Ready — ${bot.categoryCount.toLocaleString()} categories in ${Date.now() - t0}ms`);
  return bot;
}

// ─── Express app ─────────────────────────────────────────────────────────────

const app  = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

let bot: AIML2Bot;

// POST /api/chat — send a message
// Body: { message: string, sessionId?: string }
// Returns: { response: string, sessionId: string }
app.post('/api/chat', async (req, res) => {
  const { message, sessionId } = req.body as { message: string; sessionId?: string };

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    const result = await bot.talk(message.trim(), sessionId ?? undefined);
    res.json({ response: result.response || "(I'm not sure how to respond to that.)", sessionId: result.sessionId });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// DELETE /api/session/:id — clear a server-side session
app.delete('/api/session/:id', (req, res) => {
  const deleted = bot.deleteSession(req.params.id);
  res.json({ deleted });
});

// GET /api/status
app.get('/api/status', (_req, res) => {
  res.json({
    categories: bot.categoryCount,
    name: bot.getProperty('name'),
  });
});

// ─── Boot ─────────────────────────────────────────────────────────────────────

(async () => {
  bot = await createBot();
  app.listen(PORT, () => {
    console.log(`\n🌐 Open http://localhost:${PORT}\n`);
  });
})();
