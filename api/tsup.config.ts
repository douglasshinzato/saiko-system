import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  clean: true,
  sourcemap: true,
  minify: false,
  target: 'node20',
  shims: true, // Adiciona shims para __dirname e __filename se necessário em ESM
});
