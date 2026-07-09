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
      target: 'esnext',
      rollupOptions: {
        output: {
          compact: true,
          generatedCode: 'es2015',
          manualChunks: function(id) {
            if (id.includes('node_modules/react') && !id.includes('react-table')) return 'vendor';
            if (id.includes('node_modules/react-router')) return 'vendor';
            if (id.includes('node_modules/scheduler')) return 'vendor';
            if (id.indexOf('@supabase/postgrest-js') !== -1) return 'supabase-db';
            if (id.indexOf('@supabase/auth-js') !== -1) return 'supabase-auth';
            if (id.indexOf('@supabase/storage-js') !== -1) return 'supabase-storage';
            if (id.indexOf('@supabase/functions-js') !== -1) return 'supabase-functions';
            if (id.includes('node_modules/@supabase')) return 'supabase';
            if (id.includes('node_modules/@tanstack/query-core') || id.includes('node_modules/@tanstack/react-query')) return 'query';
            if (id.includes('node_modules/dexie')) return 'dexie';
            if (id.includes('node_modules/@radix-ui')) return 'radix';
            if (id.includes('node_modules/@stripe')) return 'stripe';
          },
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
