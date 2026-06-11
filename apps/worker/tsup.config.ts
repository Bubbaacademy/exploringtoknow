import { defineConfig } from 'tsup';

// Bundle the source-only workspace packages (@etk/*) INTO the worker output so
// `node dist/index.js` runs without TS path aliases. Real npm deps (pg-boss,
// node-cron, @langchain/*) stay external and resolve from node_modules in prod.
//
// ESM interop banner: some transitive CommonJS deps reachable through @etk/*
// (e.g. openai → node-fetch → whatwg-url) use `require('punycode')`. esbuild's
// ESM output routes such calls through a `__require` helper that delegates to an
// ambient `require` when one exists — so we provide a real one via createRequire.
// Without this the worker crashes at startup: "Dynamic require of \"punycode\"".
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  noExternal: [/^@etk\//],
  banner: {
    js: [
      "import { createRequire as __etkCreateRequire } from 'module';",
      "import { fileURLToPath as __etkFileURLToPath } from 'url';",
      "import { dirname as __etkDirname } from 'path';",
      'const require = __etkCreateRequire(import.meta.url);',
      'const __filename = __etkFileURLToPath(import.meta.url);',
      'const __dirname = __etkDirname(__filename);',
    ].join('\n'),
  },
});
