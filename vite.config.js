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
      target: 'baseline-widely-available',
      sourcemap: false,
      cacheDir: 'node_modules/.vite-build-cache',
      rollupOptions: {
        output: {
          compact: true,
          generatedCode: 'es2015',
          manualChunks: function(id) {
            if (id.includes('node_modules/react') && !id.includes('react-table')) return 'vendor-react';
            if (id.includes('node_modules/react-dom')) return 'vendor-react';
            if (id.includes('node_modules/scheduler')) return 'vendor-react';
            if (id.includes('node_modules/@supabase')) return 'vendor-supabase';
            if (id.includes('node_modules/@tanstack/query-core') || id.includes('node_modules/@tanstack/react-query')) return 'vendor-query';
            if (id.includes('node_modules/@tanstack/react-virtual')) return 'vendor-virtual';
            if (id.includes('node_modules/@radix-ui/react-slot')) return 'vendor-radix-slot';
            if (id.includes('node_modules/@radix-ui')) return 'vendor-radix';
            if (id.includes('node_modules/@stripe/react-stripe-js')) return 'vendor-stripe-react';
            if (id.includes('node_modules/@stripe/stripe-js')) return 'vendor-stripe-core';
            if (id.includes('node_modules/react-router-dom')) return 'vendor-router';
            if (id.includes('node_modules/dexie')) return 'vendor-dexie';
            if (id.includes('node_modules/tailwindcss')) return 'vendor-tailwind';
            if (id.includes('node_modules/tailwind-merge') || id.includes('node_modules/tailwindcss-animate')) return 'vendor-tailwind-utils';
            if (id.includes('node_modules/class-variance-authority') || id.includes('node_modules/clsx')) return 'vendor-class-utils';
            if (id.includes('node_modules/@ai-sdk')) return 'vendor-ai';
            if (id.includes('node_modules')) return 'vendor-misc';
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
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
          passes: 2,
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
      target: 'baseline-widely-available',
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: ['nodemailer']
    }
  };
});
