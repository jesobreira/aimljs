import { defineConfig } from 'tsup';

export default defineConfig([
  // ── Library bundle (CJS + ESM + types) ──────────────────────────────────
  {
    name: 'lib',
    entry: { index: 'src/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    platform: 'neutral',
    target: 'es2018',
    // Node built-ins are external so browser bundlers can polyfill or ignore them.
    external: ['fs', 'fs/promises', 'path', 'child_process', 'os', 'url'],
    noExternal: ['@xmldom/xmldom'],
  },

  // ── CLI tools: aiml-validate + aiml-serve ────────────────────────────────
  {
    name: 'cli',
    entry: {
      'aiml-validate': 'bin/aiml-validate.ts',
      'aiml-serve':    'bin/aiml-serve.ts',
    },
    format: ['esm'],
    dts: false,
    sourcemap: false,
    splitting: false,
    platform: 'node',
    target: 'node18',
    external: ['fs', 'fs/promises', 'path', 'child_process', 'os', 'url', '@xmldom/xmldom'],
    noExternal: [],
  },
]);
