#!/usr/bin/env node
/**
 * build-vercel — prepare the project for Vercel deployment
 *
 * Steps:
 *   1. Build the library (tsup → dist/)
 *   2. Copy app/public/ → public/  (Vercel static output directory)
 */

import { mkdir, readdir, copyFile, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC  = join(ROOT, 'app/public');
const DEST = join(ROOT, 'public');

async function copyDir(src: string, dest: string) {
  await mkdir(dest, { recursive: true });
  for (const entry of await readdir(src, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      await copyDir(join(src, entry.name), join(dest, entry.name));
    } else {
      await copyFile(join(src, entry.name), join(dest, entry.name));
    }
  }
}

(async () => {
  console.log('🔨 Building library…');
  execSync('npx tsup', { cwd: ROOT, stdio: 'inherit' });

  console.log('\n📂 Copying app/public → public/…');
  await rm(DEST, { recursive: true, force: true });
  await copyDir(SRC, DEST);

  console.log('\n✅ Vercel build complete\n');
  console.log('   Vercel will serve:');
  console.log('   · public/          → static frontend (CDN)');
  console.log('   · api/index.ts     → serverless API  (/api/*)');
  console.log('   · dev/**           → bundled AIML files\n');
})().catch(err => { console.error(err); process.exit(1); });
