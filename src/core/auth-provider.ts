import { execSync } from 'node:child_process';

export interface IAuthProvider {
  getToken(customToken?: string): string;
}

export class GcpAuthProvider implements IAuthProvider {
  private static instance: GcpAuthProvider;
  private cachedToken: string = '';
  private tokenExpiresAt: number = 0;

  public static getInstance(): GcpAuthProvider {
    if (!GcpAuthProvider.instance) {
      GcpAuthProvider.instance = new GcpAuthProvider();
    }
    return GcpAuthProvider.instance;
  }

  /**
   * Retrieves a valid Bearer token, using memory cache with TTL to optimize latency.
   */
  public getToken(customToken?: string): string {
    if (customToken && customToken.trim()) {
      return customToken.trim();
    }

    const now = Date.now();
    // Use cached token if valid for at least 60 seconds
    if (this.cachedToken && this.tokenExpiresAt > now + 60_000) {
      return this.cachedToken;
    }

    try {
      // Fetch fresh token from gcloud
      const output = execSync('gcloud auth print-access-token', {
        encoding: 'utf-8',
        timeout: 10_000,
        stdio: ['ignore', 'pipe', 'ignore']
      }).trim();

      if (output && output.startsWith('ya29.')) {
        this.cachedToken = output;
        // Standard GCP OAuth tokens expire in 3600 seconds; cache for 50 minutes (3000s)
        this.tokenExpiresAt = now + 3_000_000;
        return this.cachedToken;
      }
      return output;
    } catch (err: any) {
      console.warn('[GcpAuthProvider] Token retrieval failed:', err.message);
      return '';
    }
  }

  public clearCache(): void {
    this.cachedToken = '';
    this.tokenExpiresAt = 0;
  }
}
