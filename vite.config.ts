import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppRouter } from './src/server/router.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'vais-api-middleware',
      configureServer(server) {
        const router = new AppRouter();
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.startsWith('/api/') || req.url === '/api')) {
            router.handleRequest(req, res).catch(err => {
              console.error('[API Middleware Error]', err);
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    host: '127.0.0.1'
  }
});
