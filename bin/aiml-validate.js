#!/usr/bin/env node
// Compiled entry-point wrapper — delegates to the built dist file.
// This file is what `npm install -g aiml.js` puts on PATH.
import('../dist/aiml-validate.js').catch(err => {
  // If dist not built, fall back to tsx (dev usage)
  const { execFileSync } = require('child_process');
  try {
    execFileSync(
      process.execPath,
      [require.resolve('tsx/dist/cli.cjs'), new URL('./aiml-validate.ts', import.meta.url).pathname, ...process.argv.slice(2)],
      { stdio: 'inherit' }
    );
  } catch {
    console.error('Run `npm run build` first, or use `npx tsx bin/aiml-validate.ts`');
    process.exit(2);
  }
});
