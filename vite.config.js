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
      target: 'es2020',
      rollupOptions: {
        output: {
          compact: true,
          generatedCode: 'es2015',
          manualChunks: undefined,  // Let Rollup decide
        },
        onwarn(warning, warn) {
          if (warning.code === 'UNUSED_EXTERNAL_IMPORT' && warning.exporter && warning.exporter.indexOf('@supabase/') !== -1) return;
          if (warning.code === 'UNUSED_EXTERNAL_IMPORT' && warning.exporter && warning.exporter.indexOf('@stripe/') !== -1) return;
          if (warning.code === 'CIRCULAR_DEPENDENCY') return;
          warn(warning);
        }
      },
      chunkSizeWarningLimit: 300,
    },
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'react',
    },
  };
});
