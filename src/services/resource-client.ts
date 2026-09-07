import type { IAuthProvider } from '../core/auth-provider.ts';
import { GcpAuthProvider } from '../core/auth-provider.ts';
import type { IDiscoveryEngineResource } from '../types/discovery-engine.ts';

export interface IResourceListResult {
  status: 'ok' | 'error';
  items?: IDiscoveryEngineResource[];
  message?: string;
}

export interface IEngineDataStoreItem {
  id: string;
  displayName: string;
  fullPath: string;
  parserType: 'LAYOUT' | 'DIGITAL' | 'OCR' | 'DEFAULT' | 'UNSPECIFIED';
}

export interface IEngineDataStoresResult {
  status: 'ok' | 'error';
  engineId?: string;
  displayName?: string;
  dataStores?: IEngineDataStoreItem[];
  message?: string;
}

export class ResourceService {
  private authProvider: IAuthProvider;

  constructor(authProvider?: IAuthProvider) {
    this.authProvider = authProvider || GcpAuthProvider.getInstance();
  }

  public async listResources(
    projectId: string,
    location: string = 'global',
    collectionId: string = 'default_collection',
    resourceType: 'engines' | 'dataStores' = 'engines',
    apiVersion: string = 'v1alpha',
    customToken?: string,
    quotaProject?: string
  ): Promise<IResourceListResult> {
    const token = this.authProvider.getToken(customToken);
    if (!token) {
      return {
        status: 'error',
        message: 'Google Cloud 인증 실패. 로컬 gcloud에 로그인되어 있는지 확인하세요.'
      };
    }

    const targetUrl = `https://discoveryengine.googleapis.com/${apiVersion}/projects/${projectId}/locations/${location}/collections/${collectionId}/${resourceType}`;

    try {
      const res = await fetch(targetUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Goog-User-Project': quotaProject || projectId
        }
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          status: 'error',
          message: data?.error?.message || `GCP HTTP ${res.status} 오류`
        };
      }

      const items: IDiscoveryEngineResource[] = [];

      if (resourceType === 'engines') {
        for (const e of data.engines || []) {
          const id = e.name?.split('/').pop() || '';
          items.push({
            id,
            displayName: e.displayName || id,
            solutionType: e.solutionType,
            dataStoreIds: (e.dataStoreIds || []).map((ds: string) => ds.split('/').pop() || '')
          });
        }
      } else {
        for (const d of data.dataStores || []) {
          const id = d.name?.split('/').pop() || '';
          items.push({
            id,
            displayName: d.displayName || id
          });
        }
      }

      return {
        status: 'ok',
        items
      };
    } catch (err: any) {
      return {
        status: 'error',
        message: `네트워크 오류: ${err.message}`
      };
    }
  }

  public async getEngineDataStores(
    projectId: string,
    location: string = 'global',
    collectionId: string = 'default_collection',
    engineId: string,
    apiVersion: string = 'v1alpha',
    customToken?: string,
    quotaProject?: string
  ): Promise<IEngineDataStoresResult> {
    const token = this.authProvider.getToken(customToken);
    if (!token) {
      return {
        status: 'error',
        message: 'Google Cloud 인증 실패. gcloud auth application-default login 상태를 확인하세요.'
      };
    }

    const engineUrl = `https://discoveryengine.googleapis.com/${apiVersion}/projects/${projectId}/locations/${location}/collections/${collectionId}/engines/${engineId}`;

    try {
      const res = await fetch(engineUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Goog-User-Project': quotaProject || projectId
        }
      });

      const engineData = await res.json();
      if (!res.ok) {
        return {
          status: 'error',
          message: engineData?.error?.message || `엔진 조회 실패 (HTTP ${res.status})`
        };
      }

      const dataStoreIds: string[] = (engineData.dataStoreIds || []).map((ds: string) => ds.split('/').pop() || '');
      const dataStoreItems: IEngineDataStoreItem[] = [];

      // Fetch metadata in parallel for each dataStore attached to this engine
      await Promise.all(
        dataStoreIds.map(async (dsId) => {
          const dsUrl = `https://discoveryengine.googleapis.com/${apiVersion}/projects/${projectId}/locations/${location}/collections/${collectionId}/dataStores/${dsId}`;
          try {
            const dsRes = await fetch(dsUrl, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'X-Goog-User-Project': quotaProject || projectId
              }
            });
            if (dsRes.ok) {
              const dsJson = await dsRes.json();
              const parsingConfig = dsJson?.documentProcessingConfig?.defaultParsingConfig;
              let parserType: IEngineDataStoreItem['parserType'] = 'UNSPECIFIED';
              if (parsingConfig?.layoutParsingConfig) {
                parserType = 'LAYOUT';
              } else if (parsingConfig?.digitalParsingConfig) {
                parserType = 'DIGITAL';
              } else if (parsingConfig?.ocrParsingConfig) {
                parserType = 'OCR';
              } else if (parsingConfig) {
                parserType = 'DEFAULT';
              }

              dataStoreItems.push({
                id: dsId,
                displayName: dsJson.displayName || dsId,
                fullPath: `projects/${projectId}/locations/${location}/collections/${collectionId}/dataStores/${dsId}`,
                parserType
              });
              return;
            }
          } catch {
            // ignore network error on individual item
          }

          dataStoreItems.push({
            id: dsId,
            displayName: dsId,
            fullPath: `projects/${projectId}/locations/${location}/collections/${collectionId}/dataStores/${dsId}`,
            parserType: 'UNSPECIFIED'
          });
        })
      );

      return {
        status: 'ok',
        engineId,
        displayName: engineData.displayName || engineId,
        dataStores: dataStoreItems
      };
    } catch (err: any) {
      return {
        status: 'error',
        message: `엔진 데이터스토어 조회 실패: ${err.message}`
      };
    }
  }
}
