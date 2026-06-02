#!/usr/bin/env node
/**
 * aiml-validate — CLI tool for validating AIML files
 *
 * Usage:
 *   aiml-validate file.aiml [file2.aiml ...]
 *   aiml-validate ./my-bot/                  # scan directory
 *   aiml-validate -r ./my-bot/               # recursive
 *   aiml-validate --stats ./my-bot/          # show category counts
 *
 * Exit codes:
 *   0  — all files valid
 *   1  — one or more files have errors
 *   2  — bad arguments / IO error
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { parseAIML } from '../src/parsers/AIMLParser.js';

// ─── ANSI colours ─────────────────────────────────────────────────────────────
const isTTY = process.stdout.isTTY;
const c = {
  reset:  isTTY ? '\x1b[0m'  : '',
  bold:   isTTY ? '\x1b[1m'  : '',
  dim:    isTTY ? '\x1b[2m'  : '',
  red:    isTTY ? '\x1b[31m' : '',
  yellow: isTTY ? '\x1b[33m' : '',
  green:  isTTY ? '\x1b[32m' : '',
  cyan:   isTTY ? '\x1b[36m' : '',
  blue:   isTTY ? '\x1b[34m' : '',
};

// ─── Arg parsing ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
  console.log(`
${c.bold}aiml-validate${c.reset} — AIML file validator

${c.bold}Usage:${c.reset}
  aiml-validate [options] <file|directory> [...]

${c.bold}Options:${c.reset}
  -r, --recursive    Recurse into subdirectories
  -s, --stats        Show per-file category/warning counts
  -q, --quiet        Only show errors (no warnings or stats)
  --json             Output results as JSON
  -h, --help         Show this help
  -v, --version      Show version

${c.bold}Examples:${c.reset}
  aiml-validate bot.aiml
  aiml-validate ./alice/*.aiml
  aiml-validate -r ./knowledge-base
  aiml-validate --stats --json ./rosie/aiml
`);
  process.exit(0);
}

if (args.includes('-v') || args.includes('--version')) {
  // Read version from package.json synchronously
  try {
    const { createRequire } = await import('module');
    const req = createRequire(import.meta.url);
    console.log(req('../package.json').version);
  } catch { console.log('1.0.0'); }
  process.exit(0);
}

const flagsSet = new Set(args.filter(a => a.startsWith('-')));
const recursive  = flagsSet.has('-r') || flagsSet.has('--recursive');
const showStats  = flagsSet.has('-s') || flagsSet.has('--stats');
const quiet      = flagsSet.has('-q') || flagsSet.has('--quiet');
const jsonOutput = flagsSet.has('--json');
const paths      = args.filter(a => !a.startsWith('-'));

if (paths.length === 0) {
  console.error(`${c.red}Error:${c.reset} No files or directories specified. Use --help for usage.`);
  process.exit(2);
}

// ─── File collection ─────────────────────────────────────────────────────────

async function collectFiles(target: string): Promise<string[]> {
  let s: Awaited<ReturnType<typeof stat>>;
  try { s = await stat(target); }
  catch { return []; }

  if (s.isFile()) {
    return extname(target).toLowerCase() === '.aiml' ? [target] : [];
  }
  if (s.isDirectory()) {
    const entries = await readdir(target, { withFileTypes: true });
    const results: string[] = [];
    for (const e of entries) {
      const full = join(target, e.name);
      if (e.isFile() && extname(e.name).toLowerCase() === '.aiml') {
        results.push(full);
      } else if (e.isDirectory() && recursive) {
        results.push(...await collectFiles(full));
      }
    }
    return results;
  }
  return [];
}

// ─── Validation ──────────────────────────────────────────────────────────────

interface FileResult {
  file: string;
  valid: boolean;
  categories: number;
  errors: Array<{ message: string; element?: string }>;
  warnings: Array<{ message: string; element?: string }>;
  parseMs: number;
}

async function validateFile(filePath: string): Promise<FileResult> {
  const t0 = Date.now();
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch (e) {
    return {
      file: filePath,
      valid: false,
      categories: 0,
      errors: [{ message: `Cannot read file: ${String(e)}` }],
      warnings: [],
      parseMs: Date.now() - t0,
    };
  }

  const result = parseAIML(content, basename(filePath));
  return {
    file: filePath,
    valid: result.errors.length === 0,
    categories: result.categories.length,
    errors: result.errors,
    warnings: result.warnings,
    parseMs: Date.now() - t0,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const allFiles: string[] = [];
for (const p of paths) {
  const found = await collectFiles(p);
  if (found.length === 0 && !p.startsWith('-')) {
    console.error(`${c.yellow}Warning:${c.reset} No .aiml files found at "${p}"`);
  }
  allFiles.push(...found);
}

if (allFiles.length === 0) {
  console.error(`${c.red}Error:${c.reset} No .aiml files found.`);
  process.exit(2);
}

const results: FileResult[] = await Promise.all(allFiles.map(validateFile));

// ─── JSON output ──────────────────────────────────────────────────────────────

if (jsonOutput) {
  console.log(JSON.stringify({
    summary: {
      total: results.length,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length,
      totalCategories: results.reduce((s, r) => s + r.categories, 0),
      totalErrors: results.reduce((s, r) => s + r.errors.length, 0),
      totalWarnings: results.reduce((s, r) => s + r.warnings.length, 0),
    },
    files: results,
  }, null, 2));
  process.exit(results.some(r => !r.valid) ? 1 : 0);
}

// ─── Text output ─────────────────────────────────────────────────────────────

let totalErrors = 0;
let totalWarnings = 0;
let totalCategories = 0;

for (const r of results) {
  const icon = r.valid ? `${c.green}✓${c.reset}` : `${c.red}✗${c.reset}`;
  const file = `${c.bold}${r.file}${c.reset}`;

  if (r.valid && quiet) continue;

  const catInfo = showStats ? `${c.dim} (${r.categories} categories, ${r.parseMs}ms)${c.reset}` : '';
  console.log(`${icon} ${file}${catInfo}`);

  if (!quiet) {
    for (const err of r.errors) {
      console.log(`  ${c.red}✗ error${c.reset}   ${err.message}${err.element ? ` [${err.element}]` : ''}`);
    }
    for (const warn of r.warnings) {
      console.log(`  ${c.yellow}⚠ warning${c.reset} ${warn.message}${warn.element ? ` [${warn.element}]` : ''}`);
    }
  }

  totalErrors += r.errors.length;
  totalWarnings += r.warnings.length;
  totalCategories += r.categories;
}

// Summary line
const totalFiles = results.length;
const validFiles = results.filter(r => r.valid).length;
const invalidFiles = totalFiles - validFiles;

console.log('');
console.log(`${c.bold}Results:${c.reset} ${totalFiles} file${totalFiles !== 1 ? 's' : ''} checked`);

if (totalCategories > 0) {
  console.log(`  ${c.cyan}${totalCategories.toLocaleString()}${c.reset} categories loaded`);
}
if (validFiles > 0) {
  console.log(`  ${c.green}${validFiles}${c.reset} valid`);
}
if (invalidFiles > 0) {
  console.log(`  ${c.red}${invalidFiles}${c.reset} with errors (${totalErrors} total)`);
}
if (totalWarnings > 0 && !quiet) {
  console.log(`  ${c.yellow}${totalWarnings}${c.reset} warning${totalWarnings !== 1 ? 's' : ''}`);
}

process.exit(invalidFiles > 0 ? 1 : 0);
