#!/usr/bin/env node
/**
 * vercel-build.cjs — plain CJS build script for Vercel
 * No tsx required, no scripts/ dependency.
 */
'use strict';
const { cpSync, rmSync } = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const ROOT = __dirname;
const SRC  = path.join(ROOT, 'app', 'public');
const DEST = path.join(ROOT, 'public');

console.log('🔨 Building library (tsup)…');
execSync('npx tsup', { cwd: ROOT, stdio: 'inherit' });

console.log('\n📂 Copying app/public → public/…');
rmSync(DEST, { recursive: true, force: true });
cpSync(SRC, DEST, { recursive: true });

console.log('\n✅ Vercel build complete');
console.log('   · public/       → static frontend');
console.log('   · api/index.ts  → serverless API');
console.log('   · dev/**        → bundled AIML files\n');
