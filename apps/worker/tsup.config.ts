import { defineConfig } from 'tsup';

// Bundle the source-only workspace packages (@etk/*) INTO the worker output so
// `node dist/index.js` runs without TS path aliases. Real npm deps (pg-boss,
// node-cron, @langchain/*) stay external and resolve from node_modules in prod.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  noExternal: [/^@etk\//],
});
