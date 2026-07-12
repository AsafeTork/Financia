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
        input: {
          main: './index.html'
        },
output: {
          compact: true,
          generatedCode: 'es2015',
          manualChunks: {
            'vendor': [
              'react',
              'react-dom',
              'scheduler',
              '@supabase/postgrest-js',
              '@supabase/auth-js',
              '@supabase/storage-js',
              '@supabase/functions-js',
              '@supabase/supabase-js',
              '@tanstack/react-query',
              '@tanstack/query-core',
              'dexie',
              '@radix-ui/react-label',
              '@radix-ui/react-slot',
              '@stripe/react-stripe-js',
              '@stripe/stripe-js',
              'clsx',
              'tailwind-merge',
              'tailwindcss-animate',
              'class-variance-authority',
              'nodemailer'
            ]
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
