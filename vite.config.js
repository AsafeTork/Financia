import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig(async function() {
  var plugins = [react()];
  var version = JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;

  if (process.env.ANALYZE) {
    var { visualizer } = await import('rollup-plugin-visualizer');
    plugins.push(visualizer({ open: true, gzipSize: true, brotliSize: true }));
  }

  plugins.push({
    name: 'html-version-replace',
    transformIndexHtml(html) {
      return html.replace(/%APP_VERSION%/g, version);
    }
  });

  return {
    plugins: plugins,
    publicDir: 'public',
    server: {
      allowedHosts: ['financiabr.onrender.com', 'localhost', '127.0.0.1'],
    },
    preview: {
      allowedHosts: ['financiabr.onrender.com', 'localhost', '127.0.0.1'],
      port: 4173,
      host: '0.0.0.0',
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      target: 'es2020',
      rollupOptions: {
        output: {
          compact: true,
          generatedCode: 'es2015',
          manualChunks: function(id) {
            // React + ReactDOM MUST be in SAME chunk (tight coupling, shared internals)
            if (id.includes('node_modules/react') && !id.includes('react-table')) return 'vendor-react';
            if (id.includes('node_modules/react-dom')) return 'vendor-react';
            
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
            
            // nodemailer - EXCLUDE from vendor (Node.js only)
            if (id.includes('node_modules/nodemailer')) return 'nodemailer';
            
            // Scheduler - separate chunk (no deps)
            if (id.includes('node_modules/scheduler')) return 'vendor-scheduler';
            
            // Everything else from node_modules
            if (id.includes('node_modules')) return 'vendor';
          },
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
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: ['nodemailer']
    }
  };
});
