import { AppServer } from './server/server.ts';

const PORT = Number(process.env.PORT) || 8000;
const HOST = '127.0.0.1'; // Enforce localhost for security

const server = new AppServer(PORT, HOST);

server.start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

// Graceful shutdown handling
const shutdown = async () => {
  console.log('\nReceived shutdown signal, terminating server...');
  await server.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
