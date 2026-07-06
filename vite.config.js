import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Apenas o conteudo de `public/` e copiado para `dist`. Arquivos sensiveis da
  // raiz (package.json, package-lock.json, vite.config.js, .env) NUNCA entram no
  // build e portanto nao sao servidos publicamente.
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  optimizeDeps: {
    // Suprime warnings deprecated de `esbuildOptions`
    disabled: false,
  },
  esbuild: {
    // Suprime warnings deprecated de `esbuild` no plugin React
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.js'],
    globals: true,

  },
});
