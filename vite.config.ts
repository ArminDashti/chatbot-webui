import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-192.png', 'pwa-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Company Chatbot',
        short_name: 'Chatbot',
        description: 'Company chatbot WebUI',
        start_url: '/',
        display: 'standalone',
        background_color: '#0b1220',
        theme_color: '#0284c7',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,webmanifest}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              request.method === 'GET' && url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
            options: {
              cacheName: 'chatbot-api-get',
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
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5184,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8134',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:8134',
        changeOrigin: true,
      },
    },
  },
})
