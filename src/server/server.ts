import http from 'node:http';
import { AppRouter } from './router.ts';

export class AppServer {
  private server: http.Server;
  private router: AppRouter = new AppRouter();
  private port: number;
  private host: string;

  constructor(port: number = 8000, host: string = '127.0.0.1') {
    this.port = port;
    this.host = host;
    this.server = http.createServer((req, res) => this.router.handleRequest(req, res));
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, this.host, () => {
        console.log(`[VAIS Tester] Server running at http://${this.host}:${this.port}`);
        console.log(`[VAIS Tester] Environment: Node ${process.version} (Native TypeScript)`);
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('[VAIS Tester] Server stopped gracefully.');
        resolve();
      });
    });
  }
}
