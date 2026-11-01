
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const base = process.env.GITHUB_ACTIONS || process.env.GITHUB_PAGES ? '/ArabPromptdawAi/' : './';

const rootDir = path.dirname(
  fileURLToPath(import.meta.url)
);

export default defineConfig(() => ({
  base,

  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      manifestFilename: 'manifest.webmanifest',

      manifest: {
        id: base,

        name: 'Arabiprompt AI Studio',
        short_name: 'Arabiprompt',

        description:
          'منصة عربية احترافية مجانية بالكامل لهندسة الأوامر وإنشاء برومبتات الصور والفيديو',

        lang: 'ar',
        dir: 'rtl',

        theme_color: '#000000',
        background_color: '#ffffff',

        display: 'standalone',
        orientation: 'portrait-primary',

        start_url: base,
        scope: base,

        categories: [
          'productivity',
          'education',
          'graphics',
          'utilities',
        ],

        icons: [
          {
            src: `${base}icons/icon-192x192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${base}icons/icon-512x512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${base}icons/icon-maskable-512x512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,

        globPatterns: [
          '**/*.{js,css,html,ico,png,jpg,jpeg,webp,svg,woff,woff2}',
        ],

        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,

        runtimeCaching: [
          {
            urlPattern:
              /^https:\/\/fonts\.googleapis\.com\/.*/i,

            handler: 'StaleWhileRevalidate',

            options: {
              cacheName: 'google-fonts-stylesheets',

              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 31536000,
              },

              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          {
            urlPattern:
              /^https:\/\/fonts\.gstatic\.com\/.*/i,

            handler: 'CacheFirst',

            options: {
              cacheName: 'google-fonts-webfonts',

              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 31536000,
              },

              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },

      devOptions: {
        enabled: false,
      },
    }),
  ],

  resolve: {
    dedupe: [
      'react',
      'react-dom',
    ],

    alias: {
      '@': rootDir,
    },
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
    ],
  },

  build: {
    target: 'esnext',

    cssMinify: true,
    minify: 'esbuild',

    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/firebase')) {
            return 'vendor-firebase';
          }
          if (id.includes('node_modules/prismjs') || id.includes('node_modules/react-markdown')) {
            return 'vendor-syntax';
          }
          if (id.includes('node_modules/motion')) {
            return 'vendor-motion';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-lucide';
          }
        },
      },
    },

    chunkSizeWarningLimit: 1200,
  },

  server: {
    hmr:
      process.env.DISABLE_HMR !== 'true',
  },
}));
