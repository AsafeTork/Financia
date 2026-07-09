import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(async function() {
  var plugins = [react()];

  if (process.env.ANALYZE) {
    var { visualizer } = await import('rollup-plugin-visualizer');
    plugins.push(visualizer({ open: true, gzipSize: true, brotliSize: true }));
  }

  return {
    plugins: plugins,
    publicDir: 'public',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            radix: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-label', '@radix-ui/react-navigation-menu', '@radix-ui/react-select', '@radix-ui/react-slot', '@radix-ui/react-toast'],
            query: ['@tanstack/react-query'],
            dexie: ['dexie'],
            stripe: ['@stripe/react-stripe-js', '@stripe/stripe-js'],
          },
        },
      },
    },
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'react',
    },
  };
});
