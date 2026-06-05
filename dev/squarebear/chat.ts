#!/usr/bin/env npx tsx
/**
 * Squarebear interactive chat runner
 *
 * Usage:
 *   npx tsx dev/squarebear/chat.ts
 *   npm run chat:squarebear
 */

import { createInterface } from 'readline';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { AIML1Bot } from '../../src/index.js';

const AIML_DIR = join(dirname(fileURLToPath(import.meta.url)));
const TTY = process.stdin.isTTY ?? false;

async function main() {
  process.stdout.write('Loading Squarebear… ');

  const bot = new AIML1Bot({
    properties: { name: 'Squarebear', version: '1.0', species: 'robot' },
  });

  await bot.loadDirectory(AIML_DIR, false, ['.aiml']);

  console.log(`done (${bot.categoryCount} categories loaded).\n`);
  console.log('─'.repeat(50));
  console.log(' Squarebear  —  type "exit" to quit');
  console.log('─'.repeat(50) + '\n');

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const SESSION = 'user';
  const queue: string[] = [];
  let busy = false;

  async function processNext() {
    if (busy || queue.length === 0) return;
    busy = true;
    const input = queue.shift()!;

    if (input.toLowerCase() === 'exit') {
      console.log('Squarebear: Goodbye!');
      rl.close();
      return;
    }

    const { response } = await bot.talk(input, SESSION);
    if (!TTY) process.stdout.write(`You: ${input}\n`);
    console.log(`Squarebear: ${response || '(no response)'}\n`);
    if (TTY) process.stdout.write('You: ');

    busy = false;
    processNext();
  }

  if (TTY) process.stdout.write('You: ');

  rl.on('line', (raw) => {
    const input = raw.trim();
    if (!input) { if (TTY) process.stdout.write('You: '); return; }
    queue.push(input);
    processNext();
  });

  rl.on('close', () => process.exit(0));
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
