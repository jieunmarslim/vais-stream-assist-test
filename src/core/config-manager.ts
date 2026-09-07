import fs from 'node:fs';
import path from 'node:path';
import type { IEnvConfig } from '../types/config.ts';

export class ConfigManager {
  private static instance: ConfigManager;
  private envFilePath: string;

  private constructor(envFilePath?: string) {
    this.envFilePath = envFilePath || path.resolve(process.cwd(), '.env');
  }

  public static getInstance(envFilePath?: string): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager(envFilePath);
    }
    return ConfigManager.instance;
  }

  /**
   * Reloads and parses the .env file fresh from disk.
   */
  public loadConfig(): IEnvConfig {
    const raw: Record<string, string> = {};

    if (fs.existsSync(this.envFilePath)) {
      const content = fs.readFileSync(this.envFilePath, 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const equalsIdx = trimmed.indexOf('=');
        if (equalsIdx !== -1) {
          const key = trimmed.slice(0, equalsIdx).trim();
          const val = trimmed.slice(equalsIdx + 1).trim();
          raw[key] = val;
        }
      }
    }

    const projectId = raw['PROJECT_ID'] || process.env['GOOGLE_CLOUD_PROJECT'] || 'agentspace-test-469511';
    const resourceType = (raw['RESOURCE_TYPE'] === 'dataStores' ? 'dataStores' : 'engines') as 'engines' | 'dataStores';
    const engineId = raw['ENGINE_ID'] || 'gemini-enhanced-parser-tes_1775720801989';
    const datastoreId = raw['DATASTORE_ID'] || '';

    return {
      projectId,
      location: raw['LOCATION'] || 'global',
      collectionId: raw['COLLECTION_ID'] || 'default_collection',
      resourceType,
      engineId,
      datastoreId,
      servingConfigId: raw['SERVING_CONFIG_ID'] || 'default_search',
      apiVersion: raw['API_VERSION'] || 'v1alpha',
      hasToken: false // Evaluated by AuthProvider
    };
  }
}
