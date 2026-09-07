import type { IClientSearchConfig, ISearchApiResponse } from '../types/config.ts';
import type { ISearchRequestPayload, ISearchResponse } from '../types/discovery-engine.ts';
import type { IAuthProvider } from '../core/auth-provider.ts';
import { GcpAuthProvider } from '../core/auth-provider.ts';
import { PayloadBuilder } from '../core/payload-builder.ts';

export interface ISearchExecutionResult {
  statusCode: number;
  latencyMs: number;
  response: ISearchResponse | null;
  error: string | null;
}

export interface ISearchExecutor {
  execute(cfg: IClientSearchConfig, payload: ISearchRequestPayload, targetUrl: string): Promise<ISearchExecutionResult>;
}

/**
 * Live Google Cloud Search Executor
 */
export class LiveGcpSearchExecutor implements ISearchExecutor {
  private authProvider: IAuthProvider;

  constructor(authProvider?: IAuthProvider) {
    this.authProvider = authProvider || GcpAuthProvider.getInstance();
  }

  public async execute(cfg: IClientSearchConfig, payload: ISearchRequestPayload, targetUrl: string): Promise<ISearchExecutionResult> {
    const token = this.authProvider.getToken(cfg.custom_token);
    if (!token) {
      return {
        statusCode: 401,
        latencyMs: 0,
        response: null,
        error: 'Google Cloud 인증 실패. 로컬 gcloud 로그인 상태를 확인하거나 Custom Bearer Token을 입력하세요.'
      };
    }

    const quotaProject = cfg.quota_project || cfg.project_id;
    const startTime = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35_000);

    try {
      const gcpRes = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Goog-User-Project': quotaProject
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const latencyMs = Date.now() - startTime;
      clearTimeout(timeoutId);

      let gcpJson: any = null;
      try {
        gcpJson = await gcpRes.json();
      } catch {
        gcpJson = { rawText: await gcpRes.text() };
      }

      const errorMsg = gcpRes.ok ? null : (gcpJson?.error?.message || `GCP HTTP ${gcpRes.status}`);

      return {
        statusCode: gcpRes.status,
        latencyMs,
        response: gcpJson,
        error: errorMsg
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      const isAbort = err.name === 'AbortError';
      return {
        statusCode: 504,
        latencyMs,
        response: null,
        error: isAbort ? 'GCP API 호출 타임아웃 (35초 초과)' : `네트워크 통신 오류: ${err.message}`
      };
    }
  }
}

/**
 * Search Service Orchestrator
 */
export class SearchService {
  private liveExecutor: LiveGcpSearchExecutor;

  constructor(liveExecutor?: LiveGcpSearchExecutor) {
    this.liveExecutor = liveExecutor || new LiveGcpSearchExecutor();
  }

  public async search(cfg: IClientSearchConfig): Promise<ISearchApiResponse> {
    const payload = PayloadBuilder.build(cfg);

    const apiVersion = cfg.api_version || 'v1alpha';
    const location = cfg.location || 'global';
    const collectionId = cfg.collection_id || 'default_collection';
    const resourceType = cfg.resource_type || 'engines';
    const resourceId = cfg.resource_id || 'default-engine';
    const servingConfigId = cfg.serving_config_id || 'default_search';
    const quotaProject = cfg.quota_project || cfg.project_id;

    const targetUrl = `https://discoveryengine.googleapis.com/${apiVersion}/projects/${cfg.project_id}/locations/${location}/collections/${collectionId}/${resourceType}/${resourceId}/servingConfigs/${servingConfigId}:search`;

    const curlCommand = PayloadBuilder.buildCurlCommand(targetUrl, quotaProject, payload);
    const result = await this.liveExecutor.execute(cfg, payload, targetUrl);

    return {
      status_code: result.statusCode,
      latency_ms: result.latencyMs,
      endpoint_url: targetUrl,
      request_payload: payload,
      curl_command: curlCommand,
      response: result.response,
      error: result.error
    };
  }
}
