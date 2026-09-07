import type { ISearchRequestPayload, ISearchResponse } from './discovery-engine.ts';

export interface IEnvConfig {
  projectId: string;
  location: string;
  collectionId: string;
  resourceType: 'engines' | 'dataStores';
  engineId: string;
  datastoreId: string;
  servingConfigId: string;
  apiVersion: string;
  hasToken: boolean;
}

export interface IClientSearchConfig {
  project_id: string;
  location?: string;
  collection_id?: string;
  resource_type?: 'engines' | 'dataStores';
  resource_id: string;
  serving_config_id?: string;
  api_version?: string;
  custom_token?: string;
  quota_project?: string;

  query: string;
  page_size?: number;
  offset?: number;
  page_token?: string;
  filter?: string;
  canonical_filter?: string;
  order_by?: string;
  user_id?: string;
  user_pseudo_id?: string;
  relevance_threshold?: string;
  ranking_expression?: string;

  summary_spec?: {
    enabled?: boolean;
    summary_result_count?: number;
    include_citations?: boolean;
    ignore_adversarial_query?: boolean;
    ignore_non_summary_seeking_query?: boolean;
    ignore_low_relevant_content?: boolean;
    language_code?: string;
    model_version?: string;
    model_prompt_preamble?: string;
    use_semantic_chunks?: boolean;
  };

  extractive_spec?: {
    enabled?: boolean;
    max_extractive_answer_count?: number;
    max_extractive_segment_count?: number;
    return_extractive_segment_score?: boolean;
    num_previous_segments?: number;
    num_next_segments?: number;
  };

  snippet_spec?: {
    return_snippet?: boolean;
    max_snippet_count?: number;
  };

  search_result_mode?: 'DOCUMENTS' | 'CHUNKS';
  chunk_spec?: {
    num_previous_chunks?: number;
    num_next_chunks?: number;
  };

  query_expansion_spec?: {
    condition?: 'AUTO' | 'DISABLED';
    pin_unexpanded_results?: boolean;
  };

  spell_correction_spec?: {
    mode?: 'AUTO' | 'SUGGESTION_ONLY';
  };

  nl_understanding_spec?: {
    filter_extraction_condition?: 'DISABLED' | 'ENABLED';
    geo_search_condition?: 'DISABLED' | 'ENABLED';
  };

  boost_specs?: Array<{ condition: string; boost: number }>;
  facet_specs?: Array<{ key: string; limit?: number } | string>;
  data_store_specs?: Array<{ dataStore: string } | string>;
  custom_params_json?: string;
}

export interface ISearchApiResponse {
  status_code: number;
  latency_ms: number;
  endpoint_url: string;
  request_payload: ISearchRequestPayload;
  curl_command: string;
  response: ISearchResponse | null;
  error: string | null;
}
