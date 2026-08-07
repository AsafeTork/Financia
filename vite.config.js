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
      target: 'es2020',
      sourcemap: false,
      cacheDir: 'node_modules/.vite-build-cache',
      rollupOptions: {
        output: {
          compact: true,
          generatedCode: 'es2015',
          manualChunks: function(id) {
            if (process.env.DEBUG_CHUNKS && id.includes('node_modules/@supabase')) console.log('[CHUNK]', id.split('/node_modules/')[1]);
            if (id.includes('node_modules/react') && !id.includes('react-table')) return 'react-vendor';
            if (id.includes('node_modules/react-dom')) return 'react-vendor';
            if (id.includes('node_modules/scheduler')) return 'react-vendor';
            if (id.includes('node_modules/react-router')) return 'react-vendor';
            if (id.includes('node_modules/@supabase')) return 'supabase-vendor';
            if (id.includes('node_modules/@stripe/react-stripe-js')) return 'stripe-vendor';
            if (id.includes('node_modules/@stripe/stripe-js')) return 'stripe-vendor';
            if (id.includes('node_modules/@radix-ui')) return 'ui-vendor';
            if (id.includes('node_modules/class-variance-authority') || id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge')) return 'ui-vendor';
            if (id.includes('node_modules/dexie')) return 'dexie-vendor';
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'charts-vendor';
            if (id.includes('node_modules/date-fns') || id.includes('node_modules/luxon') || id.includes('node_modules/zod') || id.includes('node_modules/yup')) return 'utils-vendor';
            if (id.includes('node_modules/@tanstack/query-core') || id.includes('node_modules/@tanstack/react-query')) return 'query-vendor';
            if (id.includes('node_modules/@tanstack/react-virtual')) return 'virtual-vendor';
            if (id.includes('node_modules/tailwindcss')) return 'tailwind-vendor';
            if (id.includes('node_modules/@ai-sdk')) return 'ai-vendor';
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
      target: 'es2020',
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: ['nodemailer']
    }
  };
});
