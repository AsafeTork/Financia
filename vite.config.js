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
    css: {
      codeSplit: true,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      target: 'es2022',
      cssMinify: 'terser',
      sourcemap: false,
      rollupOptions: {
        output: {
          compact: true,
          generatedCode: 'es2015',
          manualChunks: function(id) {
            if (id.includes('node_modules/react') && !id.includes('react-table')) return 'vendor-react';
            if (id.includes('node_modules/react-dom')) return 'vendor-react';
            if (id.includes('node_modules/scheduler')) return 'vendor-scheduler';
            if (id.indexOf('@supabase/postgrest-js') !== -1) return 'supabase-db';
            if (id.indexOf('@supabase/auth-js') !== -1) return 'supabase-auth';
            if (id.indexOf('@supabase/storage-js') !== -1) return 'supabase-storage';
            if (id.indexOf('@supabase/functions-js') !== -1) return 'supabase-functions';
            if (id.includes('node_modules/@supabase')) return 'supabase';
            if (id.includes('node_modules/@tanstack/query-core') || id.includes('node_modules/@tanstack/react-query')) return 'query';
            if (id.includes('node_modules/dexie')) return 'dexie';
            if (id.includes('node_modules/@radix-ui')) return 'radix';
            if (id.includes('node_modules/@stripe')) return 'stripe';
            if (id.includes('node_modules/nodemailer')) return 'nodemailer';
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
      reportCompressedSize: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          passes: 2,
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          unsafe_math: true,
          unsafe_proto: true,
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
        },
      },
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
