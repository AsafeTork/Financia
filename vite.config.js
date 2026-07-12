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
      modulePreload: {
        polyfill: true
      },
      rollupOptions: {
        output: {
          compact: true,
          generatedCode: 'es2015',
          manualChunks: function(id) {
            // React DOM MUST come first (depends on react)
            if (id.includes('node_modules/react-dom')) return 'vendor-react-dom';
            // React core - MUST be separate from vendor, loaded before react-dom
            if (id.includes('node_modules/react') && !id.includes('react-table')) return 'vendor-react';
            // Scheduler - no deps on react/react-dom
            if (id.includes('node_modules/scheduler')) return 'vendor-scheduler';
            
            // Supabase - split by module
            if (id.indexOf('@supabase/postgrest-js') !== -1) return 'supabase-db';
            if (id.indexOf('@supabase/auth-js') !== -1) return 'supabase-auth';
            if (id.indexOf('@supabase/storage-js') !== -1) return 'supabase-storage';
            if (id.indexOf('@supabase/functions-js') !== -1) return 'supabase-functions';
            if (id.includes('node_modules/@supabase')) return 'supabase';
            
            // TanStack Query
            if (id.includes('node_modules/@tanstack/query-core') || id.includes('node_modules/@tanstack/react-query')) return 'query';
            
            // Dexie
            if (id.includes('node_modules/dexie')) return 'dexie';
            
            // Radix UI
            if (id.includes('node_modules/@radix-ui')) return 'radix';
            
            // Stripe
            if (id.includes('node_modules/@stripe')) return 'stripe';
            
            // Everything else from node_modules
            if (id.includes('node_modules')) return 'vendor';
          },
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
        },
        onwarn(warning, warn) {
          if (warning.code === 'UNUSED_EXTERNAL_IMPORT' && warning.exporter && warning.exporter.indexOf('@supabase/') !== -1) return;
          if (warning.code === 'UNUSED_EXTERNAL_IMPORT' && warning.exporter && warning.exporter.indexOf('@stripe/') !== -1) return;
          if (warning.code === 'CIRCULAR_DEPENDENCY') return;
          warn(warning);
        }
      },
      chunkSizeWarningLimit: 500,
    },
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'react',
    },
  };
});
