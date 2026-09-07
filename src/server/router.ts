import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ConfigManager } from '../core/config-manager.ts';
import { GcpAuthProvider } from '../core/auth-provider.ts';
import { SearchService } from '../services/search-client.ts';
import { ResourceService } from '../services/resource-client.ts';
import type { IClientSearchConfig } from '../types/config.ts';

export class AppRouter {
  private configManager = ConfigManager.getInstance();
  private authProvider = GcpAuthProvider.getInstance();
  private searchService = new SearchService();
  private resourceService = new ResourceService();
  private staticDir: string;

  constructor(staticDir?: string) {
    this.staticDir = staticDir || path.resolve(process.cwd(), 'static');
  }

  public async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // Enforce Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline'; img-src 'self' data:;");

    const host = req.headers.host || '127.0.0.1:8000';
    const url = new URL(req.url || '/', `http://${host}`);
    const pathname = url.pathname;

    const distDir = path.resolve(process.cwd(), 'dist');
    const isDistAvailable = fs.existsSync(path.join(distDir, 'index.html'));
    const baseDir = isDistAvailable ? distDir : this.staticDir;

    // 1. Static Web UI
    if (pathname === '/' || pathname === '/index.html') {
      const indexPath = path.join(baseDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fs.readFileSync(indexPath));
        return;
      }
    }

    if (pathname.startsWith('/assets/') || pathname.startsWith('/static/')) {
      const folder = pathname.startsWith('/assets/') ? 'assets' : '';
      const relPath = pathname.replace(/^\/(assets|static)\//, '');
      const safeRelPath = path.normalize(relPath).replace(/^(\.\.[\/\\])+/, '');
      const fullPath = path.join(baseDir, folder, safeRelPath);

      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        const ext = path.extname(fullPath);
        const mimeMap: Record<string, string> = {
          '.js': 'application/javascript; charset=utf-8',
          '.ts': 'application/javascript; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.html': 'text/html; charset=utf-8',
          '.json': 'application/json; charset=utf-8',
          '.svg': 'image/svg+xml'
        };
        res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'text/plain' });
        res.end(fs.readFileSync(fullPath));
        return;
      }
    }

    // 2. GET /api/env-info
    if (pathname === '/api/env-info' && req.method === 'GET') {
      const env = this.configManager.loadConfig();
      const token = this.authProvider.getToken();
      env.hasToken = Boolean(token);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(env));
      return;
    }

    // 3. GET /api/list-resources
    if (pathname === '/api/list-resources' && req.method === 'GET') {
      const projectId = url.searchParams.get('project_id') || 'agentspace-test-469511';
      const location = url.searchParams.get('location') || 'global';
      const collectionId = url.searchParams.get('collection_id') || 'default_collection';
      const resourceType = (url.searchParams.get('resource_type') === 'dataStores' ? 'dataStores' : 'engines');
      const apiVersion = url.searchParams.get('api_version') || 'v1alpha';
      const customToken = url.searchParams.get('custom_token') || undefined;
      const quotaProject = url.searchParams.get('quota_project') || undefined;

      const result = await this.resourceService.listResources(
        projectId,
        location,
        collectionId,
        resourceType,
        apiVersion,
        customToken,
        quotaProject
      );

      res.writeHead(result.status === 'ok' ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    // 3.1. GET /api/engine-datastores
    if (pathname === '/api/engine-datastores' && req.method === 'GET') {
      const projectId = url.searchParams.get('project_id') || 'agentspace-test-469511';
      const location = url.searchParams.get('location') || 'global';
      const collectionId = url.searchParams.get('collection_id') || 'default_collection';
      const engineId = url.searchParams.get('engine_id') || '';
      const apiVersion = url.searchParams.get('api_version') || 'v1alpha';
      const customToken = url.searchParams.get('custom_token') || undefined;
      const quotaProject = url.searchParams.get('quota_project') || undefined;

      if (!engineId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'engine_id query parameter is required' }));
        return;
      }

      const result = await this.resourceService.getEngineDataStores(
        projectId,
        location,
        collectionId,
        engineId,
        apiVersion,
        customToken,
        quotaProject
      );

      res.writeHead(result.status === 'ok' ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    // 4. POST /api/search
    if (pathname === '/api/search' && req.method === 'POST') {
      try {
        const bodyStr = await this.readBody(req);
        const cfg: IClientSearchConfig = JSON.parse(bodyStr || '{}');

        if (!cfg.query && cfg.query !== '') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '질의(query) 파라미터가 필요합니다.' }));
          return;
        }

        const apiResponse = await this.searchService.search(cfg);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(apiResponse));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status_code: 500, error: err.message }));
      }
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }

  private readBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let data = '';
      const MAX_SIZE = 2 * 1024 * 1024; // 2MB limit for safety

      req.on('data', chunk => {
        data += chunk;
        if (data.length > MAX_SIZE) {
          req.destroy();
          reject(new Error('Request payload too large'));
        }
      });

      req.on('end', () => resolve(data));
      req.on('error', err => reject(err));
    });
  }
}
