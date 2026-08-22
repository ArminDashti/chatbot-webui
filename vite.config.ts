import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { VitePWA } from 'vite-plugin-pwa'

const basePath = process.env.VITE_BASE_PATH || '/'
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8134'
const baseNoSlash = basePath.replace(/\/$/, '') || ''
const configureSseProxy = (proxy: {
  on: (event: string, fn: (...args: unknown[]) => void) => void
}) => {
  proxy.on('proxyRes', (proxyRes: { headers: Record<string, unknown> }, _req: unknown, res: {
    setHeader: (k: string, v: string) => void
  }) => {
    const contentType = proxyRes.headers['content-type']
    if (typeof contentType === 'string' && contentType.includes('text/event-stream')) {
      proxyRes.headers['cache-control'] = 'no-cache, no-transform'
      proxyRes.headers['x-accel-buffering'] = 'no'
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('X-Accel-Buffering', 'no')
    }
  })
}

export default defineConfig({
  base: basePath,
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-192.png', 'pwa-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Company Chatbot',
        short_name: 'Chatbot',
        description: 'Company chatbot WebUI',
        start_url: basePath,
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
        navigateFallback: basePath === '/' ? '/index.html' : `${baseNoSlash}/index.html`,
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              request.method === 'GET' && url.pathname.includes('/api/'),
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
    port: Number(process.env.VITE_DEV_PORT || 5184),
    allowedHosts: true,
    watch: {
      usePolling: process.env.CHOKIDAR_USEPOLLING === 'true',
    },
    hmr: {
      clientPort: Number(process.env.VITE_HMR_CLIENT_PORT || process.env.VITE_DEV_PORT || 5184),
    },
    proxy: {
      [`${baseNoSlash}/api`]: {
        target: apiProxyTarget,
        changeOrigin: true,
        timeout: 0,
        proxyTimeout: 0,
        rewrite: (p) => p.replace(new RegExp(`^${baseNoSlash}/api`), '/api'),
        configure: configureSseProxy,
      },
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        timeout: 0,
        proxyTimeout: 0,
        configure: configureSseProxy,
      },
      [`${baseNoSlash}/health`]: {
        target: apiProxyTarget,
        changeOrigin: true,
        rewrite: (p) => p.replace(new RegExp(`^${baseNoSlash}/health`), '/health'),
      },
      '/health': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
})
