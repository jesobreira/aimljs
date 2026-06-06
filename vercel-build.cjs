#!/usr/bin/env node
/**
 * vercel-build.cjs — Vercel build script
 *
 * Steps:
 *   1. Compile library with tsup (api/index.ts imports from dist/)
 *   2. Copy app/public/ → public/ (Vercel static output)
 */
'use strict';
const { execSync } = require('child_process');
const path = require('path');
const fs   = require('fs');

const ROOT = __dirname;
const SRC  = path.join(ROOT, 'app', 'public');
const DEST = path.join(ROOT, 'public');

// Use the locally installed tsup binary — avoids npx resolution issues
const tsup = path.join(ROOT, 'node_modules', '.bin', 'tsup');

console.log('🔨 Compiling library with tsup…');
execSync(`"${tsup}"`, { cwd: ROOT, stdio: 'inherit', shell: true });

console.log('\n📂 Copying app/public → public/…');
if (fs.existsSync(DEST)) {
  execSync(`rm -rf "${DEST}"`, { stdio: 'inherit' });
}
execSync(`cp -r "${SRC}" "${DEST}"`, { stdio: 'inherit' });

console.log('\n✅ Vercel build complete');
console.log('   · public/       → static frontend (CDN)');
console.log('   · api/index.ts  → serverless API (compiled by Vercel)');
console.log('   · dist/         → compiled library (imported by api/index.ts)');
console.log('   · dev/**        → AIML files (bundled by Vercel includeFiles)\n');
