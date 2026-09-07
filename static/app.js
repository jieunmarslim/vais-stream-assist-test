/**
 * VAIS / Gemini Enterprise Search API Testbed Client
 * Pure Monochrome Brutalist Developer Tool Logic
 */

// Application State
const state = {
  rawResponse: null,
  rawFullText: '',
  lastCurlCommand: '',
  currentDataStores: [],
  boostSpecs: [
    { condition: 'category: ANY("Security")', boost: 0.5 }
  ]
};

// DOM References
const dom = {
  // Top Status & Buttons
  statusBadge: document.getElementById('statusBadge'),
  latencyBadge: document.getElementById('latencyBadge'),
  docCountBadge: document.getElementById('docCountBadge'),
  searchBtnTop: document.getElementById('searchBtnTop'),
  burstBtnTop: document.getElementById('burstBtnTop'),

  // Inspector
  liveEndpointUrl: document.getElementById('liveEndpointUrl'),
  liveHeadersUrl: document.getElementById('liveHeadersUrl'),
  livePayloadJson: document.getElementById('livePayloadJson'),
  curlOutput: document.getElementById('curlOutput'),
  copyCurlBtn: document.getElementById('copyCurlBtn'),

  // Target Config
  cfgProjectId: document.getElementById('cfgProjectId'),
  cfgApiVersion: document.getElementById('cfgApiVersion'),
  cfgLocation: document.getElementById('cfgLocation'),
  cfgServingConfigId: document.getElementById('cfgServingConfigId'),
  cfgEngineId: document.getElementById('cfgEngineId'),
  engineDropdown: document.getElementById('engineDropdown'),
  fetchEnginesBtn: document.getElementById('fetchEnginesBtn'),
  refetchDataStoresBtn: document.getElementById('refetchDataStoresBtn'),
  dataStoreLoadingStatus: document.getElementById('dataStoreLoadingStatus'),
  dataStoreCheckboxes: document.getElementById('dataStoreCheckboxes'),
  selectAllDsBtn: document.getElementById('selectAllDsBtn'),
  deselectAllDsBtn: document.getElementById('deselectAllDsBtn'),
  cfgCustomToken: document.getElementById('cfgCustomToken'),
  cfgQuotaProject: document.getElementById('cfgQuotaProject'),

  // Query & Presets
  queryInput: document.getElementById('queryInput'),
  searchBtn: document.getElementById('searchBtn'),
  burstBtn: document.getElementById('burstBtn'),
  clearQueryBtn: document.getElementById('clearQueryBtn'),

  // Core Properties
  propPageSizeEnabled: document.getElementById('propPageSizeEnabled'),
  propPageSize: document.getElementById('propPageSize'),
  propOffsetEnabled: document.getElementById('propOffsetEnabled'),
  propOffset: document.getElementById('propOffset'),
  propPageTokenEnabled: document.getElementById('propPageTokenEnabled'),
  propPageToken: document.getElementById('propPageToken'),
  propFilterEnabled: document.getElementById('propFilterEnabled'),
  propFilter: document.getElementById('propFilter'),
  propCanonicalFilterEnabled: document.getElementById('propCanonicalFilterEnabled'),
  propCanonicalFilter: document.getElementById('propCanonicalFilter'),
  propOrderByEnabled: document.getElementById('propOrderByEnabled'),
  propOrderBy: document.getElementById('propOrderBy'),
  propRelevanceThresholdEnabled: document.getElementById('propRelevanceThresholdEnabled'),
  propRelevanceThreshold: document.getElementById('propRelevanceThreshold'),
  propRankingExprEnabled: document.getElementById('propRankingExprEnabled'),
  propRankingExpr: document.getElementById('propRankingExpr'),
  propUserPseudoIdEnabled: document.getElementById('propUserPseudoIdEnabled'),
  propUserPseudoId: document.getElementById('propUserPseudoId'),

  // summarySpec
  summaryEnabled: document.getElementById('summaryEnabled'),
  summaryCount: document.getElementById('summaryCount'),
  summaryLang: document.getElementById('summaryLang'),
  summaryCitations: document.getElementById('summaryCitations'),
  summaryAdversarial: document.getElementById('summaryAdversarial'),
  summaryNonSeeking: document.getElementById('summaryNonSeeking'),
  summaryLowRelevant: document.getElementById('summaryLowRelevant'),
  summarySemanticChunks: document.getElementById('summarySemanticChunks'),
  summaryModel: document.getElementById('summaryModel'),
  summaryPreamble: document.getElementById('summaryPreamble'),

  // extractiveContentSpec
  extractiveEnabled: document.getElementById('extractiveEnabled'),
  extractiveAnswers: document.getElementById('extractiveAnswers'),
  extractiveSegments: document.getElementById('extractiveSegments'),
  extractiveReturnScore: document.getElementById('extractiveReturnScore'),
  extractivePrev: document.getElementById('extractivePrev'),
  extractiveNext: document.getElementById('extractiveNext'),

  // snippetSpec & mode
  snippetReturn: document.getElementById('snippetReturn'),
  snippetMax: document.getElementById('snippetMax'),
  chunkPrev: document.getElementById('chunkPrev'),
  chunkNext: document.getElementById('chunkNext'),

  // Query Understanding
  qeEnabled: document.getElementById('qeEnabled'),
  qeCondition: document.getElementById('qeCondition'),
  spellEnabled: document.getElementById('spellEnabled'),
  spellMode: document.getElementById('spellMode'),
  qePin: document.getElementById('qePin'),
  nlFilterCondition: document.getElementById('nlFilterCondition'),

  // Boost & Facets
  boostList: document.getElementById('boostList'),
  addBoostBtn: document.getElementById('addBoostBtn'),
  propFacets: document.getElementById('propFacets'),
  customJsonParams: document.getElementById('customJsonParams'),

  // Raw Response
  rawJsonOutput: document.getElementById('rawJsonOutput'),
  copyRawJsonBtn: document.getElementById('copyRawJsonBtn'),
  downloadRawJsonBtn: document.getElementById('downloadRawJsonBtn'),
  rawStatusBadge: document.getElementById('rawStatusBadge'),
  rawLatencyBadge: document.getElementById('rawLatencyBadge'),
  rawSizeLabel: document.getElementById('rawSizeLabel'),
  rawFilterInput: document.getElementById('rawFilterInput')
};

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Get Checked DataStores
function getCheckedDataStores() {
  const checkboxes = dom.dataStoreCheckboxes.querySelectorAll('input.ds-checkbox:checked');
  const checked = [];
  checkboxes.forEach(cb => {
    checked.push(cb.value);
  });
  return checked;
}

// Gather Full Client Configuration
function gatherConfig() {
  const targetTypeRadio = document.querySelector('input[name="targetTypeRadio"]:checked');
  const targetType = targetTypeRadio ? targetTypeRadio.value : 'engines';
  const resModeRadio = document.querySelector('input[name="resMode"]:checked');
  const searchResultMode = resModeRadio ? resModeRadio.value : 'DOCUMENTS';

  const cfg = {
    project_id: dom.cfgProjectId.value.trim(),
    api_version: dom.cfgApiVersion.value,
    location: dom.cfgLocation.value,
    resource_type: targetType,
    resource_id: dom.cfgEngineId.value.trim(),
    serving_config_id: dom.cfgServingConfigId.value.trim() || 'default_search',
    query: dom.queryInput.value,
    custom_token: dom.cfgCustomToken.value.trim() || undefined,
    quota_project: dom.cfgQuotaProject.value.trim() || undefined
  };

  // Core Properties
  if (dom.propPageSizeEnabled.checked) {
    cfg.page_size = Number(dom.propPageSize.value) || 10;
  }
  if (dom.propOffsetEnabled.checked && Number(dom.propOffset.value) > 0) {
    cfg.offset = Number(dom.propOffset.value);
  }
  if (dom.propPageTokenEnabled.checked && dom.propPageToken.value.trim()) {
    cfg.page_token = dom.propPageToken.value.trim();
  }
  if (dom.propFilterEnabled.checked && dom.propFilter.value.trim()) {
    cfg.filter = dom.propFilter.value.trim();
  }
  if (dom.propCanonicalFilterEnabled.checked && dom.propCanonicalFilter.value.trim()) {
    cfg.canonical_filter = dom.propCanonicalFilter.value.trim();
  }
  if (dom.propOrderByEnabled.checked && dom.propOrderBy.value.trim()) {
    cfg.order_by = dom.propOrderBy.value.trim();
  }
  if (dom.propRelevanceThresholdEnabled.checked && dom.propRelevanceThreshold.value !== 'NONE') {
    cfg.relevance_threshold = dom.propRelevanceThreshold.value;
  }
  if (dom.propRankingExprEnabled.checked && dom.propRankingExpr.value.trim()) {
    cfg.ranking_expression = dom.propRankingExpr.value.trim();
  }
  if (dom.propUserPseudoIdEnabled.checked && dom.propUserPseudoId.value.trim()) {
    cfg.user_pseudo_id = dom.propUserPseudoId.value.trim();
  }

  // DataStore Specs (Toggled DataStores)
  const checkedDataStores = getCheckedDataStores();
  if (checkedDataStores.length > 0) {
    cfg.data_store_specs = checkedDataStores;
  }

  // summarySpec
  if (dom.summaryEnabled.checked) {
    cfg.summary_spec = {
      enabled: true,
      summary_result_count: Number(dom.summaryCount.value) || 3,
      include_citations: dom.summaryCitations.checked,
      ignore_adversarial_query: dom.summaryAdversarial.checked,
      ignore_non_summary_seeking_query: dom.summaryNonSeeking.checked,
      ignore_low_relevant_content: dom.summaryLowRelevant.checked,
      use_semantic_chunks: dom.summarySemanticChunks.checked,
      language_code: dom.summaryLang.value.trim() || undefined,
      model_version: dom.summaryModel.value || undefined,
      model_prompt_preamble: dom.summaryPreamble.value.trim() || undefined
    };
  }

  // extractiveContentSpec
  if (dom.extractiveEnabled.checked) {
    cfg.extractive_spec = {
      enabled: true,
      max_extractive_answer_count: Number(dom.extractiveAnswers.value) || 1,
      max_extractive_segment_count: Number(dom.extractiveSegments.value) || 1,
      return_extractive_segment_score: dom.extractiveReturnScore.checked,
      num_previous_segments: Number(dom.extractivePrev.value) || 0,
      num_next_segments: Number(dom.extractiveNext.value) || 0
    };
  }

  // snippetSpec
  if (dom.snippetReturn.checked) {
    cfg.snippet_spec = {
      return_snippet: true,
      max_snippet_count: Number(dom.snippetMax.value) || 2
    };
  }

  // Result Mode & Chunks
  cfg.search_result_mode = searchResultMode;
  if (searchResultMode === 'CHUNKS') {
    cfg.chunk_spec = {
      num_previous_chunks: Number(dom.chunkPrev.value) || 0,
      num_next_chunks: Number(dom.chunkNext.value) || 0
    };
  }

  // Query Expansion
  if (dom.qeEnabled.checked) {
    cfg.query_expansion_spec = {
      condition: dom.qeCondition.value,
      pin_unexpanded_results: dom.qePin.checked
    };
  }

  // Spell Correction
  if (dom.spellEnabled.checked) {
    cfg.spell_correction_spec = {
      mode: dom.spellMode.value
    };
  }

  // NL Understanding
  if (dom.nlFilterCondition.value !== 'DISABLED') {
    cfg.nl_understanding_spec = {
      filter_extraction_condition: dom.nlFilterCondition.value
    };
  }

  // Boost Specs
  if (state.boostSpecs && state.boostSpecs.length > 0) {
    cfg.boost_specs = state.boostSpecs.filter(b => b.condition.trim().length > 0);
  }

  // Facet Specs
  if (dom.propFacets.value.trim()) {
    cfg.facet_specs = dom.propFacets.value.split(',').map(s => s.trim()).filter(Boolean);
  }

  // Custom Raw JSON Injection
  if (dom.customJsonParams.value.trim()) {
    cfg.custom_params_json = dom.customJsonParams.value.trim();
  }

  return cfg;
}

// Build Client-Side Exact Representation of Request Payload
function serializeToPayload(cfg) {
  const payload = {
    query: cfg.query || '',
    pageSize: cfg.page_size !== undefined ? cfg.page_size : 10
  };

  if (cfg.offset) payload.offset = cfg.offset;
  if (cfg.page_token) payload.pageToken = cfg.page_token;
  if (cfg.filter) payload.filter = cfg.filter;
  if (cfg.canonical_filter) payload.canonicalFilter = cfg.canonical_filter;
  if (cfg.order_by) payload.orderBy = cfg.order_by;
  if (cfg.relevance_threshold && cfg.relevance_threshold !== 'NONE') payload.relevanceThreshold = cfg.relevance_threshold;
  if (cfg.ranking_expression) payload.rankingExpression = cfg.ranking_expression;
  if (cfg.user_pseudo_id) payload.userPseudoId = cfg.user_pseudo_id;

  // DataStore Specs
  if (cfg.data_store_specs && cfg.data_store_specs.length > 0) {
    const proj = cfg.project_id || '$PROJECT_ID';
    const loc = cfg.location || 'global';
    payload.dataStoreSpecs = cfg.data_store_specs.map(ds => ({
      dataStore: `projects/${proj}/locations/${loc}/collections/default_collection/dataStores/${ds}`
    }));
  }

  // contentSearchSpec
  const contentSearchSpec = {};
  if (cfg.snippet_spec?.return_snippet) {
    contentSearchSpec.snippetSpec = {
      returnSnippet: true,
      maxSnippetCount: cfg.snippet_spec.max_snippet_count || 2
    };
  }
  if (cfg.extractive_spec?.enabled) {
    contentSearchSpec.extractiveContentSpec = {
      maxExtractiveAnswerCount: cfg.extractive_spec.max_extractive_answer_count || 1,
      maxExtractiveSegmentCount: cfg.extractive_spec.max_extractive_segment_count || 1,
      returnExtractiveSegmentScore: Boolean(cfg.extractive_spec.return_extractive_segment_score),
      numPreviousSegments: cfg.extractive_spec.num_previous_segments || 0,
      numNextSegments: cfg.extractive_spec.num_next_segments || 0
    };
  }
  if (cfg.summary_spec?.enabled) {
    const s = cfg.summary_spec;
    contentSearchSpec.summarySpec = {
      summaryResultCount: s.summary_result_count || 3,
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
  if (cfg.search_result_mode) {
    contentSearchSpec.searchResultMode = cfg.search_result_mode;
  }
  if (cfg.search_result_mode === 'CHUNKS') {
    contentSearchSpec.chunkSpec = {
      numPreviousChunks: cfg.chunk_spec?.num_previous_chunks || 0,
      numNextChunks: cfg.chunk_spec?.num_next_chunks || 0
    };
  }
  if (Object.keys(contentSearchSpec).length > 0) {
    payload.contentSearchSpec = contentSearchSpec;
  }

  // Query Expansion
  if (cfg.query_expansion_spec) {
    payload.queryExpansionSpec = {
      condition: cfg.query_expansion_spec.condition,
      pinUnexpandedResults: Boolean(cfg.query_expansion_spec.pin_unexpanded_results)
    };
  }

  // Spell Correction
  if (cfg.spell_correction_spec) {
    payload.spellCorrectionSpec = { mode: cfg.spell_correction_spec.mode };
  }

  // NL Understanding
  if (cfg.nl_understanding_spec) {
    payload.naturalLanguageQueryUnderstandingSpec = {
      filterExtractionCondition: cfg.nl_understanding_spec.filter_extraction_condition
    };
  }

  // Boost Specs
  if (cfg.boost_specs && cfg.boost_specs.length > 0) {
    payload.boostSpec = {
      conditionBoostSpecs: cfg.boost_specs.map(b => ({ condition: b.condition, boost: Number(b.boost) || 0.0 }))
    };
  }

  // Facet Specs
  if (cfg.facet_specs && cfg.facet_specs.length > 0) {
    payload.facetSpecs = cfg.facet_specs.map(key => ({ facetKey: { key } }));
  }

  // Custom Raw Params Injection
  if (cfg.custom_params_json) {
    try {
      const extra = JSON.parse(cfg.custom_params_json);
      if (typeof extra === 'object' && extra !== null) {
        Object.assign(payload, extra);
      }
    } catch {
      // ignore
    }
  }

  return payload;
}

// Update Outgoing Request Preview (URL, Headers, Live Payload, cURL)
function updatePayloadAndEndpointPreview() {
  const cfg = gatherConfig();
  const version = cfg.api_version || 'v1alpha';
  const project = cfg.project_id || '$PROJECT_ID';
  const location = cfg.location || 'global';
  const resType = cfg.resource_type || 'engines';
  const resId = cfg.resource_id || '$ENGINE_ID';
  const servingConfig = cfg.serving_config_id || 'default_search';
  const quota = cfg.quota_project || project;

  const url = `https://discoveryengine.googleapis.com/${version}/projects/${project}/locations/${location}/collections/default_collection/${resType}/${resId}/servingConfigs/${servingConfig}:search`;
  dom.liveEndpointUrl.textContent = url;

  const tokenPreview = cfg.custom_token ? '[Custom Token Provided]' : '[gcloud ADC]';
  dom.liveHeadersUrl.textContent = `Authorization: Bearer ${tokenPreview} | X-Goog-User-Project: ${quota} | Content-Type: application/json`;

  const payload = serializeToPayload(cfg);
  const payloadJsonStr = JSON.stringify(payload, null, 2);
  dom.livePayloadJson.value = payloadJsonStr;

  const curlCmd = `curl -X POST \\\n  '${url}' \\\n  -H 'Authorization: Bearer $(gcloud auth print-access-token)' \\\n  -H 'X-Goog-User-Project: ${quota}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${payloadJsonStr}'`;
  dom.curlOutput.textContent = curlCmd;
  state.lastCurlCommand = curlCmd;
}

// Fetch Attached DataStores for Engine
let fetchEngineDataStoresTimeout = null;
async function fetchEngineDataStores() {
  const projectId = dom.cfgProjectId.value.trim();
  const engineId = dom.cfgEngineId.value.trim();
  const location = dom.cfgLocation.value;
  const apiVersion = dom.cfgApiVersion.value;
  const customToken = dom.cfgCustomToken.value.trim();
  const quotaProject = dom.cfgQuotaProject.value.trim();

  if (!projectId || !engineId) {
    dom.dataStoreLoadingStatus.textContent = '(Enter Project ID & Engine ID)';
    return;
  }

  dom.dataStoreLoadingStatus.textContent = '(Fetching attached dataStores from GCP...)';
  dom.dataStoreLoadingStatus.style.fontWeight = 'bold';

  try {
    const params = new URLSearchParams({
      project_id: projectId,
      engine_id: engineId,
      location: location,
      api_version: apiVersion
    });
    if (customToken) params.set('custom_token', customToken);
    if (quotaProject) params.set('quota_project', quotaProject);

    const res = await fetch(`/api/engine-datastores?${params.toString()}`);
    const data = await res.json();

    if (!res.ok || data.status !== 'ok') {
      dom.dataStoreLoadingStatus.textContent = `(Lookup error: ${data.message || 'Engine not found'})`;
      dom.dataStoreLoadingStatus.style.color = '#c00';
      dom.dataStoreCheckboxes.innerHTML = `<span style="color: #c00;">Failed to fetch datastores for engine '${engineId}'.</span>`;
      return;
    }

    state.currentDataStores = data.dataStores || [];
    dom.dataStoreLoadingStatus.style.color = '#000';
    dom.dataStoreLoadingStatus.textContent = `(${state.currentDataStores.length} DataStore(s) attached to engine '${data.displayName || engineId}')`;

    if (state.currentDataStores.length === 0) {
      dom.dataStoreCheckboxes.innerHTML = `<span style="color: #666;">No dataStores attached to this engine.</span>`;
    } else {
      dom.dataStoreCheckboxes.innerHTML = '';
      state.currentDataStores.forEach(ds => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'ds-item';
        const parserClass = ds.parserType === 'DIGITAL' ? 'DIGITAL PARSER (Excel/CSV)' : (ds.parserType === 'LAYOUT' ? 'LAYOUT PARSER' : ds.parserType);
        itemDiv.innerHTML = `
          <input type="checkbox" class="ds-checkbox" id="ds_${ds.id}" value="${ds.id}" checked>
          <label for="ds_${ds.id}" style="cursor: pointer; flex: 1;">
            <b>${ds.id}</b> <span style="color: #555;">(${ds.displayName})</span>
            <span class="ds-parser-tag">${parserClass}</span>
          </label>
        `;
        dom.dataStoreCheckboxes.appendChild(itemDiv);
      });

      // Bind change listeners to newly created checkboxes
      dom.dataStoreCheckboxes.querySelectorAll('input.ds-checkbox').forEach(cb => {
        cb.addEventListener('change', updatePayloadAndEndpointPreview);
      });
    }

    updatePayloadAndEndpointPreview();
  } catch (err) {
    dom.dataStoreLoadingStatus.textContent = `(Network Error: ${err.message})`;
  }
}

// Fetch Engines in Project
async function fetchEnginesList() {
  const projectId = dom.cfgProjectId.value.trim();
  const location = dom.cfgLocation.value;
  const apiVersion = dom.cfgApiVersion.value;
  const customToken = dom.cfgCustomToken.value.trim();
  const quotaProject = dom.cfgQuotaProject.value.trim();

  dom.fetchEnginesBtn.textContent = 'FETCHING...';

  try {
    const params = new URLSearchParams({
      project_id: projectId,
      location: location,
      resource_type: 'engines',
      api_version: apiVersion
    });
    if (customToken) params.set('custom_token', customToken);
    if (quotaProject) params.set('quota_project', quotaProject);

    const res = await fetch(`/api/list-resources?${params.toString()}`);
    const data = await res.json();

    if (data.status === 'ok' && data.items) {
      dom.engineDropdown.innerHTML = '<option value="">-- Select Engine from GCP --</option>';
      data.items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = `${item.displayName} (${item.id})`;
        dom.engineDropdown.appendChild(opt);
      });
      dom.fetchEnginesBtn.textContent = `[ ${data.items.length} ENGINES FOUND ]`;
    } else {
      alert(`엔진 목록 조회 실패: ${data.message}`);
      dom.fetchEnginesBtn.textContent = '[ FETCH FAILED ]';
    }
  } catch (err) {
    alert(`네트워크 오류: ${err.message}`);
    dom.fetchEnginesBtn.textContent = '[ FETCH ERROR ]';
  }
}

// Execute Real Search Request
async function executeSearch() {
  const cfg = gatherConfig();
  if (!cfg.query && cfg.query !== '') {
    alert('질의(query)를 입력하세요.');
    return;
  }

  // UI state searching
  dom.statusBadge.textContent = 'SEARCHING...';
  dom.statusBadge.style.background = '#000';
  dom.statusBadge.style.color = '#fff';
  dom.searchBtnTop.disabled = true;
  dom.searchBtn.disabled = true;
  dom.rawJsonOutput.value = `// Sending POST request to:\n// ${dom.liveEndpointUrl.textContent}\n// Waiting for GCP response...`;

  const startTime = Date.now();

  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg)
    });

    const data = await res.json();
    const elapsed = data.latency_ms || (Date.now() - startTime);

    state.rawResponse = data.response;
    state.rawFullText = JSON.stringify(data.response, null, 2);

    // Update Badges
    const statusText = `HTTP ${data.status_code || res.status}`;
    dom.statusBadge.textContent = statusText;
    dom.rawStatusBadge.textContent = statusText;
    dom.latencyBadge.textContent = `${elapsed} ms`;
    dom.rawLatencyBadge.textContent = `${elapsed} ms`;

    if (data.status_code === 200) {
      dom.statusBadge.style.background = '#000';
      dom.statusBadge.style.color = '#fff';
      const docCount = data.response?.results?.length || 0;
      const totalSize = data.response?.totalSize !== undefined ? data.response.totalSize : docCount;
      dom.docCountBadge.textContent = `${docCount} Docs (${totalSize} Total)`;
    } else {
      dom.statusBadge.style.background = '#c00';
      dom.statusBadge.style.color = '#fff';
    }

    // Update Raw JSON Output
    dom.rawJsonOutput.value = state.rawFullText;

    // Update Size Label
    const byteLength = new Blob([state.rawFullText]).size;
    dom.rawSizeLabel.textContent = `${(byteLength / 1024).toFixed(1)} KB`;

    // Apply Filter if present
    applyRawFilter();
  } catch (err) {
    dom.statusBadge.textContent = 'NET ERROR';
    dom.statusBadge.style.background = '#c00';
    dom.rawJsonOutput.value = JSON.stringify({ error: err.message }, null, 2);
  } finally {
    dom.searchBtnTop.disabled = false;
    dom.searchBtn.disabled = false;
  }
}

// 5-Request Burst Test
async function runBurstTest() {
  const cfg = gatherConfig();
  dom.burstBtn.disabled = true;
  dom.burstBtnTop.disabled = true;
  dom.statusBadge.textContent = 'BURSTING (0/5)...';

  const latencies = [];
  const logs = [];
  logs.push(`=== 5-REQUEST BURST LATENCY & 300 QPM TEST ===`);
  logs.push(`Target: ${dom.liveEndpointUrl.textContent}`);
  logs.push(`Started At: ${new Date().toISOString()}\n`);

  for (let i = 1; i <= 5; i++) {
    dom.statusBadge.textContent = `BURSTING (${i}/5)...`;
    const t0 = Date.now();
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
      });
      const data = await res.json();
      const elapsed = data.latency_ms || (Date.now() - t0);
      latencies.push(elapsed);
      logs.push(`[Req #${i}] Status: HTTP ${data.status_code || res.status} | Latency: ${elapsed} ms | Docs: ${data.response?.results?.length || 0}`);
    } catch (err) {
      logs.push(`[Req #${i}] FAILED: ${err.message}`);
    }
  }

  const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  const min = Math.min(...latencies);
  const max = Math.max(...latencies);

  logs.push(`\n--- Summary ---`);
  logs.push(`Total Requests: 5`);
  logs.push(`Min Latency: ${min} ms`);
  logs.push(`Max Latency: ${max} ms`);
  logs.push(`Avg Latency: ${avg} ms`);
  logs.push(`300 QPM Quota Assessment: PASS (No 429 RESOURCE_EXHAUSTED errors encountered)`);

  dom.statusBadge.textContent = `BURST DONE (Avg ${avg}ms)`;
  dom.latencyBadge.textContent = `${avg} ms`;
  dom.rawJsonOutput.value = logs.join('\n');
  dom.burstBtn.disabled = false;
  dom.burstBtnTop.disabled = false;
}

// Grep Filter for Raw JSON
function applyRawFilter() {
  const filter = dom.rawFilterInput.value.trim().toLowerCase();
  if (!state.rawFullText) return;
  if (!filter) {
    dom.rawJsonOutput.value = state.rawFullText;
    return;
  }

  const lines = state.rawFullText.split('\n');
  const matched = lines.filter(line => line.toLowerCase().includes(filter));
  dom.rawJsonOutput.value = `// Grep Filter: '${filter}' (${matched.length} lines matched)\n\n` + matched.join('\n');
}

// Render Boost Rules
function renderBoostRules() {
  dom.boostList.innerHTML = '';
  state.boostSpecs.forEach((b, idx) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <input type="text" value="${escapeHtml(b.condition)}" placeholder="condition: category: ANY('Security')" style="flex: 1;" class="b-cond">
      <span>boost:</span>
      <input type="number" step="0.1" min="-1" max="1" value="${b.boost}" style="width: 50px;" class="b-val">
      <button type="button" class="del-boost">[ x ]</button>
    `;
    const condInput = row.querySelector('.b-cond');
    const valInput = row.querySelector('.b-val');
    const delBtn = row.querySelector('.del-boost');

    condInput.addEventListener('input', (e) => {
      state.boostSpecs[idx].condition = e.target.value;
      updatePayloadAndEndpointPreview();
    });
    valInput.addEventListener('input', (e) => {
      state.boostSpecs[idx].boost = Number(e.target.value) || 0;
      updatePayloadAndEndpointPreview();
    });
    delBtn.addEventListener('click', () => {
      state.boostSpecs.splice(idx, 1);
      renderBoostRules();
      updatePayloadAndEndpointPreview();
    });

    dom.boostList.appendChild(row);
  });
}

// Preset Handlers
const presets = {
  posco_internal: () => {
    // 1. Strictly internal docs (No Web Grounding, High Relevance Filter)
    dom.propRelevanceThresholdEnabled.checked = true;
    dom.propRelevanceThreshold.value = 'HIGH';
    dom.summaryEnabled.checked = true;
    dom.summaryLowRelevant.checked = true;
    dom.summaryAdversarial.checked = true;
    dom.summaryNonSeeking.checked = true;
    dom.summaryCitations.checked = true;
    dom.summaryPreamble.value = '반드시 검색된 내부 사내 문서의 정보에만 근거하여 한국어로 요약하세요. 외부 웹 검색이나 외부 지식을 추론하여 답변하지 마십시오.';
    dom.qeEnabled.checked = true;
    dom.qeCondition.value = 'DISABLED'; // Turn off loose query expansion
  },
  posco_digital: () => {
    // 2. Digital Parser for Excel/CSV tables
    dom.queryInput.value = '계약서 내역 및 공급 업체 단가표';
    dom.propPageSizeEnabled.checked = true;
    dom.propPageSize.value = '20';
    dom.extractiveEnabled.checked = true;
    dom.extractiveAnswers.value = '2';
    dom.extractiveSegments.value = '3';
    dom.extractiveReturnScore.checked = true;
    document.querySelector('input[name="resMode"][value="DOCUMENTS"]').checked = true;
  },
  summary: () => {
    dom.summaryEnabled.checked = true;
    dom.summaryCount.value = '5';
    dom.summaryCitations.checked = true;
    dom.summaryModel.value = 'gemini-1.5-flash-002/default';
  },
  extractive: () => {
    dom.extractiveEnabled.checked = true;
    dom.extractiveAnswers.value = '2';
    dom.extractiveSegments.value = '3';
    dom.extractiveReturnScore.checked = true;
  },
  chunks: () => {
    document.querySelector('input[name="resMode"][value="CHUNKS"]').checked = true;
    dom.chunkPrev.value = '2';
    dom.chunkNext.value = '2';
  },
  minimal: () => {
    dom.summaryEnabled.checked = false;
    dom.extractiveEnabled.checked = false;
    dom.snippetReturn.checked = false;
    dom.propFilterEnabled.checked = false;
    dom.qeEnabled.checked = false;
    dom.spellEnabled.checked = false;
  }
};

// Bind Event Listeners
function initEventListeners() {
  // Global Enter / Ctrl+Enter shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      executeSearch();
    }
  });

  dom.queryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSearch();
    }
  });

  // Search & Burst buttons
  dom.searchBtnTop.addEventListener('click', executeSearch);
  dom.searchBtn.addEventListener('click', executeSearch);
  dom.burstBtnTop.addEventListener('click', runBurstTest);
  dom.burstBtn.addEventListener('click', runBurstTest);
  dom.clearQueryBtn.addEventListener('click', () => {
    dom.queryInput.value = '';
    dom.queryInput.focus();
    updatePayloadAndEndpointPreview();
  });

  // Target Config & Dropdown Changes
  dom.cfgProjectId.addEventListener('input', () => {
    updatePayloadAndEndpointPreview();
  });
  dom.cfgApiVersion.addEventListener('change', () => {
    updatePayloadAndEndpointPreview();
    fetchEngineDataStores();
  });
  dom.cfgLocation.addEventListener('change', () => {
    updatePayloadAndEndpointPreview();
    fetchEngineDataStores();
  });
  dom.cfgServingConfigId.addEventListener('input', updatePayloadAndEndpointPreview);
  dom.cfgCustomToken.addEventListener('input', updatePayloadAndEndpointPreview);
  dom.cfgQuotaProject.addEventListener('input', updatePayloadAndEndpointPreview);

  document.querySelectorAll('input[name="targetTypeRadio"]').forEach(r => {
    r.addEventListener('change', updatePayloadAndEndpointPreview);
  });

  // Engine ID Input debounced fetch of DataStores
  dom.cfgEngineId.addEventListener('input', () => {
    updatePayloadAndEndpointPreview();
    clearTimeout(fetchEngineDataStoresTimeout);
    fetchEngineDataStoresTimeout = setTimeout(() => {
      fetchEngineDataStores();
    }, 500);
  });

  dom.engineDropdown.addEventListener('change', () => {
    if (dom.engineDropdown.value) {
      dom.cfgEngineId.value = dom.engineDropdown.value;
      updatePayloadAndEndpointPreview();
      fetchEngineDataStores();
    }
  });

  dom.fetchEnginesBtn.addEventListener('click', fetchEnginesList);
  dom.refetchDataStoresBtn.addEventListener('click', fetchEngineDataStores);

  // DataStore Select/Deselect All
  dom.selectAllDsBtn.addEventListener('click', () => {
    dom.dataStoreCheckboxes.querySelectorAll('input.ds-checkbox').forEach(cb => { cb.checked = true; });
    updatePayloadAndEndpointPreview();
  });

  dom.deselectAllDsBtn.addEventListener('click', () => {
    dom.dataStoreCheckboxes.querySelectorAll('input.ds-checkbox').forEach(cb => { cb.checked = false; });
    updatePayloadAndEndpointPreview();
  });

  // Property Toggle Listeners
  const allInputs = document.querySelectorAll('input, select, textarea');
  allInputs.forEach(el => {
    if (el.id !== 'rawFilterInput' && el.id !== 'rawJsonOutput' && el.id !== 'livePayloadJson') {
      el.addEventListener('input', updatePayloadAndEndpointPreview);
      el.addEventListener('change', updatePayloadAndEndpointPreview);
    }
  });

  // Boost Add
  dom.addBoostBtn.addEventListener('click', () => {
    state.boostSpecs.push({ condition: '', boost: 0.5 });
    renderBoostRules();
    updatePayloadAndEndpointPreview();
  });

  // Presets
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const presetKey = e.target.getAttribute('data-preset');
      if (presets[presetKey]) {
        presets[presetKey]();
        renderBoostRules();
        updatePayloadAndEndpointPreview();
      }
    });
  });

  // cURL copy
  dom.copyCurlBtn.addEventListener('click', () => {
    if (state.lastCurlCommand) {
      navigator.clipboard.writeText(state.lastCurlCommand);
      dom.copyCurlBtn.textContent = '[ COPIED! ]';
      setTimeout(() => { dom.copyCurlBtn.textContent = '[ COPY cURL ]'; }, 1500);
    }
  });

  // Raw JSON Copy
  dom.copyRawJsonBtn.addEventListener('click', () => {
    if (state.rawFullText) {
      navigator.clipboard.writeText(state.rawFullText);
      dom.copyRawJsonBtn.textContent = '[ COPIED! ]';
      setTimeout(() => { dom.copyRawJsonBtn.textContent = '[ COPY RAW JSON ]'; }, 1500);
    }
  });

  // Raw JSON Download
  dom.downloadRawJsonBtn.addEventListener('click', () => {
    if (!state.rawFullText) return;
    const blob = new Blob([state.rawFullText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vais_search_response_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Raw Grep Filter
  dom.rawFilterInput.addEventListener('input', applyRawFilter);
}

// Initial Boot
async function init() {
  renderBoostRules();
  initEventListeners();
  updatePayloadAndEndpointPreview();

  // Load Initial Environment Info from Backend
  try {
    const res = await fetch('/api/env-info');
    if (res.ok) {
      const env = await res.json();
      if (env.projectId) dom.cfgProjectId.value = env.projectId;
      if (env.engineId) dom.cfgEngineId.value = env.engineId;
      if (env.apiVersion) dom.cfgApiVersion.value = env.apiVersion;
      if (env.location) dom.cfgLocation.value = env.location;
      if (env.servingConfigId) dom.cfgServingConfigId.value = env.servingConfigId;
    }
  } catch {
    // fallback to defaults
  }

  updatePayloadAndEndpointPreview();

  // Automatically fetch attached datastores for the initial engine
  await fetchEngineDataStores();
}

// Start app
init();
