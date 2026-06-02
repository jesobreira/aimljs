#!/usr/bin/env npx tsx
/**
 * Rosie AIML 2.0 interactive chat runner
 *
 * Usage:
 *   npx tsx dev/rosie/chat.ts
 *   # or:
 *   npm run chat:rosie
 */

import { createInterface } from 'readline';
import { dirname, join, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { readdir, readFile } from 'fs/promises';
import {
  AIML2Bot,
  parseProperties,
  parseSubstitutions,
  parseSet,
  parseMap,
} from '../../src/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)));
const TTY = process.stdin.isTTY ?? false;

async function loadDir(subdir: string) {
  const results: Array<{ name: string; content: string }> = [];
  try {
    const full = join(ROOT, subdir);
    for (const e of await readdir(full, { withFileTypes: true })) {
      if (!e.isFile()) continue;
      const content = await readFile(join(full, e.name), 'utf-8');
      results.push({ name: basename(e.name, extname(e.name)), content });
    }
  } catch { /* skip missing dirs */ }
  return results;
}

async function main() {
  process.stdout.write('Loading Rosie… ');

  const bot = new AIML2Bot({
    properties: { name: 'Rosie', version: '2.0' },
    maxRecursionDepth: 200,
  });

  // Properties & defaults
  for (const { content } of await loadDir('system')) {
    bot.loadProperties(parseProperties(content));
  }

  // Substitutions
  const subTypes: Record<string, 'normal' | 'person' | 'person2' | 'gender' | 'denormal'> = {
    normal: 'normal', person: 'person', person2: 'person2',
    gender: 'gender', denormal: 'denormal',
  };
  for (const { name, content } of await loadDir('substitutions')) {
    const type = subTypes[name.toLowerCase()];
    if (type) bot.loadSubstitutions(type, parseSubstitutions(content));
  }

  // Sets
  for (const { name, content } of await loadDir('sets')) {
    bot.loadSet(name, parseSet(content));
  }

  // Maps
  for (const { name, content } of await loadDir('maps')) {
    bot.loadMap(name, parseMap(content));
  }

  // Synthesise missing data that Rosie's GitHub repo references but doesn't ship.
  const allMaps = (bot as any).maps as Map<string, Map<string,string>>;
  const number2name = allMaps.get('number2name');
  const name2number = allMaps.get('name2number');

  // 1. "number" set  — digits + written number words
  const numberSet = new Set<string>();
  if (number2name) for (const k of number2name.keys()) numberSet.add(k);
  if (name2number) for (const k of name2number.keys()) numberSet.add(k);
  if (numberSet.size > 0) bot.loadSet('number', numberSet);

  // 2. "successor" and "predecessor" maps  — n → n±1 (used in NTHWORD utility)
  if (number2name) {
    const nums = [...number2name.keys()]
      .map(Number)
      .filter(n => !Number.isNaN(n))
      .sort((a, b) => a - b);

    const successor = new Map<string, string>();
    const predecessor = new Map<string, string>();
    for (const n of nums) {
      successor.set(String(n), String(n + 1));
      if (n > 0) predecessor.set(String(n), String(n - 1));
    }
    bot.loadMap('successor', successor);
    bot.loadMap('predecessor', predecessor);
  }

  // AIML files
  await bot.loadDirectory(join(ROOT, 'aiml'), false, ['.aiml']);

  const botName = bot.getProperty('name') || 'Rosie';
  console.log(`done (${bot.categoryCount} categories loaded).\n`);
  console.log('─'.repeat(50));
  console.log(` ${botName}  —  AIML 2.0  —  type "exit" to quit`);
  console.log('─'.repeat(50) + '\n');

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const SESSION = 'user';

  // Serial queue so async turns don't interleave
  const queue: string[] = [];
  let busy = false;

  async function processNext() {
    if (busy || queue.length === 0) return;
    busy = true;

    const input = queue.shift()!;

    if (input.toLowerCase() === 'exit') {
      console.log(`${botName}: Goodbye!`);
      rl.close();
      return;
    }

    const { response } = await bot.talk(input, SESSION);
    if (!TTY) process.stdout.write(`You: ${input}\n`);
    console.log(`${botName}: ${response || '(no response)'}\n`);
    if (TTY) process.stdout.write('You: ');

    busy = false;
    processNext();
  }

  if (TTY) process.stdout.write('You: ');

  rl.on('line', (raw) => {
    const input = raw.trim();
    if (!input) {
      if (TTY) process.stdout.write('You: ');
      return;
    }
    queue.push(input);
    processNext();
  });

  rl.on('close', () => process.exit(0));
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
