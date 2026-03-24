import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],

      manifest: {
        name: 'MechanicNG – Find a Mechanic Near You',
        short_name: 'MechanicNG',
        description: "Nigeria's trusted mechanic directory",
        theme_color: '#f97316',
        background_color: '#0a0a0f',
        display: 'standalone',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },

      workbox: {
        // Serve cached index.html for any unmatched navigation request
        navigateFallback: '/index.html',

        // Pre-cache all static build assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        runtimeCaching: [
          // ── Auth routes — never cache, always hit the network ──────────────
          // Must be first so it short-circuits before the broad API rule below
          {
            urlPattern: /^https:\/\/mechanicng-backend\.onrender\.com\/api\/auth\/.*/i,
            handler: 'NetworkOnly',
          },

          // ── Ads — very short TTL, near-real-time freshness ────────────────
          {
            urlPattern: /^https:\/\/mechanicng-backend\.onrender\.com\/api\/ads\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ads',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60, // 1 minute
              },
            },
          },

          // ── Mechanic listings — serve stale instantly, revalidate in bg ───
          {
            urlPattern: /^https:\/\/mechanicng-backend\.onrender\.com\/api\/mechanics(\?.*)?$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'mechanics-listings',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
            },
          },

          // ── Reviews — network preferred, fall back to cache ───────────────
          {
            urlPattern: /^https:\/\/mechanicng-backend\.onrender\.com\/api\/reviews\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'reviews',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
            },
          },

          // ── All other API routes — network preferred, 10 s timeout ────────
          {
            urlPattern: /^https:\/\/mechanicng-backend\.onrender\.com\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 300, // 5 minutes
              },
            },
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          maps:   ['leaflet', 'react-leaflet'],
          ui:     ['framer-motion', 'lucide-react'],
          query:  ['@tanstack/react-query'],
        },
      },
    },
  },
})