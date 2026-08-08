import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import critters from 'critters';
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
      var supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://*.supabase.co';
      var origin = supabaseUrl.replace(/\/+$/, '');
      var preconnect = '<link rel="preconnect" href="' + origin + '" crossorigin>';
      return html
        .replace(/%APP_VERSION%/g, version)
        .replace('<!-- SUPA_PRECONNECT -->', preconnect);
    }
  });

  // Injeta modulepreload dos chunks core (paraleliza descoberta)
  plugins.push({
    name: 'modulepreload-core',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace('</head>',
          '  <link rel="modulepreload" href="/src/main.jsx">\n'
          + '  <link rel="modulepreload" href="/src/App.jsx">\n'
          + '</head>');
      },
    },
  });

  plugins.push(VitePWA({
    strategies: 'injectManifest',
    srcDir: 'src',
    filename: 'sw.ts',
    injectRegister: null,
    registerType: 'prompt',
    includeAssets: ['favicon.ico', 'favicon-32.png', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
    manifest: {
      name: 'Financia — Gestão financeira',
      short_name: 'Financia',
      description: 'Controle vendas, despesas e estoque do seu negócio em um só lugar. Online e offline.',
      lang: 'pt-BR',
      dir: 'ltr',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      prefer_related_applications: false,
      background_color: '#002f59',
      theme_color: '#002f59',
      categories: ['business', 'finance', 'productivity'],
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    },
    injectManifest: {
      globPatterns: ['**/*.{js,css,html,woff2}'],
      globIgnores: ['**/manifest.json', '**/sw.js'],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    },
  }));

  plugins.push({
    name: 'critters',
    transformIndexHtml: {
      order: 'post',
      async handler(html, ctx) {
        var bundle = ctx.bundle || {};
        var c = new critters({
          preload: 'media',
          inlineFonts: true,
          noscriptFallback: true,
          logLevel: 'warn',
          path: '/',
          publicPath: '',
          pruneSource: true,
          reduceInlineStyles: true,
        });
        c.fs = {
          readFile: function(filename, callback) {
            try {
              var name = String(filename).replace(/^\/+/, '');
              var dropslash = '/' + name;
              var mod = null;
              for (var k in bundle) {
                if (k === name || '/' + k === dropslash || k.endsWith('/' + name)) { mod = bundle[k]; break; }
              }
              if (!mod || !mod.source) throw new Error('Not in bundle: ' + filename);
              var text = mod.source.toString();
              if (callback) callback(null, text);
              return Promise.resolve(text);
            } catch (err) {
              if (callback) callback(err);
              return Promise.reject(err);
            }
          },
        };
        return c.process(html);
      },
    },
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
      modulePreload: { polyfill: false },
      sourcemap: false,
      cacheDir: 'node_modules/.vite-build-cache',
      rollupOptions: {
        output: {
          compact: true,
          generatedCode: 'es2015',
          manualChunks: function(id) {
            if (process.env.DEBUG_CHUNKS && id.includes('node_modules/@supabase')) console.log('[CHUNK]', id.split('/node_modules/')[1]);
            if (id.includes('/src/lib/sync.js')) return 'sync-lib';
            if (/node_modules\/(?:tslib|@babel\/runtime)/.test(id)) return 'shared-runtime';
            if (id.includes('node_modules/react') && !id.includes('react-table')) return 'react-vendor';
            if (id.includes('node_modules/react-dom')) return 'react-vendor';
            if (id.includes('node_modules/scheduler')) return 'react-vendor';
            if (id.includes('node_modules/react-router')) return 'react-vendor';
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
