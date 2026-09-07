import type { IClientSearchConfig } from '../types/config.ts';
import type { ISearchRequestPayload, IContentSearchSpec } from '../types/discovery-engine.ts';

export class PayloadBuilder {
  /**
   * Constructs the full Google Cloud Discovery Engine Search API payload.
   * Only includes properties that are explicitly provided or toggled on.
   */
  public static build(cfg: IClientSearchConfig): ISearchRequestPayload {
    const payload: ISearchRequestPayload = {
      query: cfg.query || '',
      pageSize: Number(cfg.page_size) || 10
    };

    if (cfg.offset && Number(cfg.offset) > 0) {
      payload.offset = Number(cfg.offset);
    }

    if (cfg.page_token && cfg.page_token.trim()) {
      payload.pageToken = cfg.page_token.trim();
    }

    if (cfg.filter && cfg.filter.trim()) {
      payload.filter = cfg.filter.trim();
    }

    if (cfg.canonical_filter && cfg.canonical_filter.trim()) {
      payload.canonicalFilter = cfg.canonical_filter.trim();
    }

    if (cfg.order_by && cfg.order_by.trim()) {
      payload.orderBy = cfg.order_by.trim();
    }

    if (cfg.user_id && cfg.user_id.trim()) {
      payload.userInfo = { userId: cfg.user_id.trim() };
    }

    if (cfg.user_pseudo_id && cfg.user_pseudo_id.trim()) {
      payload.userPseudoId = cfg.user_pseudo_id.trim();
    }

    if (cfg.relevance_threshold && cfg.relevance_threshold.trim() !== 'NONE') {
      payload.relevanceThreshold = cfg.relevance_threshold.trim() as any;
    }

    if (cfg.ranking_expression && cfg.ranking_expression.trim()) {
      payload.rankingExpression = cfg.ranking_expression.trim();
    }

    // Content Search Spec
    const contentSearchSpec: IContentSearchSpec = {};

    // 1. Snippets
    if (cfg.snippet_spec?.return_snippet) {
      contentSearchSpec.snippetSpec = {
        returnSnippet: true,
        maxSnippetCount: Number(cfg.snippet_spec.max_snippet_count) || 2
      };
    }

    // 2. Extractive Content (Direct Answers & Relevant Segments)
    if (cfg.extractive_spec?.enabled) {
      contentSearchSpec.extractiveContentSpec = {
        maxExtractiveAnswerCount: Number(cfg.extractive_spec.max_extractive_answer_count) || 1,
        maxExtractiveSegmentCount: Number(cfg.extractive_spec.max_extractive_segment_count) || 1,
        returnExtractiveSegmentScore: Boolean(cfg.extractive_spec.return_extractive_segment_score),
        numPreviousSegments: Number(cfg.extractive_spec.num_previous_segments) || 0,
        numNextSegments: Number(cfg.extractive_spec.num_next_segments) || 0
      };
    }

    // 3. Gemini Grounded Summarization (summarySpec)
    if (cfg.summary_spec?.enabled) {
      const s = cfg.summary_spec;
      contentSearchSpec.summarySpec = {
        summaryResultCount: Number(s.summary_result_count) || 3,
        includeCitations: Boolean(s.include_citations),
        ignoreAdversarialQuery: Boolean(s.ignore_adversarial_query),
        ignoreNonSummarySeekingQuery: Boolean(s.ignore_non_summary_seeking_query),
        ignoreLowRelevantContent: Boolean(s.ignore_low_relevant_content),
        useSemanticChunks: Boolean(s.use_semantic_chunks),
        ...(s.language_code ? { languageCode: s.language_code } : {}),
        ...(s.model_version ? { modelSpec: { version: s.model_version } } : {}),
        ...(s.model_prompt_preamble ? { modelPromptSpec: { preamble: s.model_prompt_preamble } } : {})
      };
    }

    // 4. Search Result Mode & Chunks
    if (cfg.search_result_mode) {
      contentSearchSpec.searchResultMode = cfg.search_result_mode;
    }

    if (cfg.search_result_mode === 'CHUNKS') {
      contentSearchSpec.chunkSpec = {
        numPreviousChunks: Number(cfg.chunk_spec?.num_previous_chunks) || 0,
        numNextChunks: Number(cfg.chunk_spec?.num_next_chunks) || 0
      };
    }

    if (Object.keys(contentSearchSpec).length > 0) {
      payload.contentSearchSpec = contentSearchSpec;
    }

    // Query Expansion
    if (cfg.query_expansion_spec?.condition) {
      payload.queryExpansionSpec = {
        condition: cfg.query_expansion_spec.condition,
        pinUnexpandedResults: Boolean(cfg.query_expansion_spec.pin_unexpanded_results)
      };
    }

    // Spell Correction
    if (cfg.spell_correction_spec?.mode) {
      payload.spellCorrectionSpec = {
        mode: cfg.spell_correction_spec.mode
      };
    }

    // Natural Language Query Understanding
    if (cfg.nl_understanding_spec) {
      const nl: Record<string, any> = {};
      if (cfg.nl_understanding_spec.filter_extraction_condition && cfg.nl_understanding_spec.filter_extraction_condition !== 'DISABLED') {
        nl.filterExtractionCondition = cfg.nl_understanding_spec.filter_extraction_condition;
      }
      if (cfg.nl_understanding_spec.geo_search_condition && cfg.nl_understanding_spec.geo_search_condition !== 'DISABLED') {
        nl.geoSearchCondition = cfg.nl_understanding_spec.geo_search_condition;
      }
      if (Object.keys(nl).length > 0) {
        payload.naturalLanguageQueryUnderstandingSpec = nl;
      }
    }

    // Boost Specs
    if (cfg.boost_specs && cfg.boost_specs.length > 0) {
      const validBoosts = cfg.boost_specs
        .filter(b => b.condition && b.condition.trim().length > 0)
        .map(b => ({ condition: b.condition.trim(), boost: Number(b.boost) || 0.0 }));

      if (validBoosts.length > 0) {
        payload.boostSpec = { conditionBoostSpecs: validBoosts };
      }
    }

    // Facet Specs
    if (cfg.facet_specs && cfg.facet_specs.length > 0) {
      const validFacets: any[] = [];
      for (const f of cfg.facet_specs as any[]) {
        if (typeof f === 'string' && f.trim().length > 0) {
          validFacets.push({ facetKey: { key: f.trim() } });
        } else if (f && typeof f === 'object' && f.key && f.key.trim().length > 0) {
          const item: any = { facetKey: { key: f.key.trim() } };
          if (f.limit && Number(f.limit) > 0) item.limit = Number(f.limit);
          validFacets.push(item);
        }
      }
      if (validFacets.length > 0) {
        payload.facetSpecs = validFacets;
      }
    }

    // DataStore Specs (Toggled datastores)
    if (cfg.data_store_specs && cfg.data_store_specs.length > 0) {
      const proj = cfg.project_id || 'agentspace-test-469511';
      const loc = cfg.location || 'global';
      const coll = cfg.collection_id || 'default_collection';

      const validDsSpecs = (cfg.data_store_specs as any[])
        .map(ds => {
          let rawId = '';
          if (typeof ds === 'string') rawId = ds.trim();
          else if (ds && typeof ds.dataStore === 'string') rawId = ds.dataStore.trim();

          if (!rawId) return null;
          if (rawId.startsWith('projects/')) return { dataStore: rawId };
          return { dataStore: `projects/${proj}/locations/${loc}/collections/${coll}/dataStores/${rawId}` };
        })
        .filter((s): s is { dataStore: string } => s !== null);

      if (validDsSpecs.length > 0) {
        payload.dataStoreSpecs = validDsSpecs;
      }
    }

    // Custom Params Injection (arbitrary user JSON)
    if (cfg.custom_params_json && cfg.custom_params_json.trim()) {
      try {
        const extra = JSON.parse(cfg.custom_params_json.trim());
        if (typeof extra === 'object' && extra !== null) {
          Object.assign(payload, extra);
        }
      } catch (err: any) {
        console.warn('[PayloadBuilder] custom_params_json parse error:', err.message);
      }
    }

    return payload;
  }

  /**
   * Constructs the exact cURL reproduction command.
   */
  public static buildCurlCommand(targetUrl: string, quotaProject: string, payload: ISearchRequestPayload): string {
    return `curl -X POST \\\n  '${targetUrl}' \\\n  -H 'Authorization: Bearer $(gcloud auth print-access-token)' \\\n  -H 'X-Goog-User-Project: ${quotaProject}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${JSON.stringify(payload, null, 2)}'`;
  }
}
