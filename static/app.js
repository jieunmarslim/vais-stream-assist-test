// Gemini Enterprise / Vertex AI Search Parameter Playground App

// State
const state = {
  mode: 'mock', // 'mock' or 'live'
  activeTab: 'formatted', // 'formatted', 'raw', 'inspector'
  boostSpecs: [
    { condition: 'category: ANY("Security")', boost: 0.5 }
  ],
  lastResponseData: null,
  lastRequestPayload: null,
  lastCurlCommand: '',
  lastEndpointUrl: ''
};

// DOM Elements
const dom = {
  // Mode Buttons
  modeMockBtn: document.getElementById('modeMockBtn'),
  modeLiveBtn: document.getElementById('modeLiveBtn'),
  liveAuthBanner: document.getElementById('liveAuthBanner'),
  presetSelect: document.getElementById('presetSelect'),
  searchBtn: document.getElementById('searchBtn'),
  queryInput: document.getElementById('queryInput'),
  clearQueryBtn: document.getElementById('clearQueryBtn'),

  // Config Inputs
  cfgProjectId: document.getElementById('cfgProjectId'),
  cfgLocation: document.getElementById('cfgLocation'),
  cfgResourceType: document.getElementById('cfgResourceType'),
  cfgResourceId: document.getElementById('cfgResourceId'),
  cfgServingConfigId: document.getElementById('cfgServingConfigId'),
  cfgApiVersion: document.getElementById('cfgApiVersion'),
  cfgCustomToken: document.getElementById('cfgCustomToken'),
  cfgQuotaProject: document.getElementById('cfgQuotaProject'),

  // Summary Inputs
  summaryEnabled: document.getElementById('summaryEnabled'),
  secSummaryBody: document.getElementById('secSummaryBody'),
  summaryResultCount: document.getElementById('summaryResultCount'),
  summaryCountVal: document.getElementById('summaryCountVal'),
  summaryIncludeCitations: document.getElementById('summaryIncludeCitations'),
  summaryPrunedSummary: document.getElementById('summaryPrunedSummary'),
  summaryIgnoreAdversarial: document.getElementById('summaryIgnoreAdversarial'),
  summaryIgnoreNonSeeking: document.getElementById('summaryIgnoreNonSeeking'),
  summaryIgnoreLowRelevant: document.getElementById('summaryIgnoreLowRelevant'),
  summarySemanticChunks: document.getElementById('summarySemanticChunks'),
  summaryLanguageCode: document.getElementById('summaryLanguageCode'),
  summaryModelVersion: document.getElementById('summaryModelVersion'),
  summaryPreamble: document.getElementById('summaryPreamble'),

  // Extractive Inputs
  extractiveEnabled: document.getElementById('extractiveEnabled'),
  secExtractiveBody: document.getElementById('secExtractiveBody'),
  extractiveAnswerCount: document.getElementById('extractiveAnswerCount'),
  extractiveSegmentCount: document.getElementById('extractiveSegmentCount'),
  extractivePrevSegments: document.getElementById('extractivePrevSegments'),
  extractiveNextSegments: document.getElementById('extractiveNextSegments'),
  extractiveReturnScore: document.getElementById('extractiveReturnScore'),

  // Snippets & Mode Inputs
  snippetReturnSnippet: document.getElementById('snippetReturnSnippet'),
  snippetMaxCount: document.getElementById('snippetMaxCount'),
  chunkContextRow: document.getElementById('chunkContextRow'),
  chunkPrev: document.getElementById('chunkPrev'),
  chunkNext: document.getElementById('chunkNext'),

  // Query Understanding
  qeCondition: document.getElementById('qeCondition'),
  spellCorrection: document.getElementById('spellCorrection'),
  qePinUnexpanded: document.getElementById('qePinUnexpanded'),
  nlFilterExtraction: document.getElementById('nlFilterExtraction'),

  // Filters & Boost
  cfgFilter: document.getElementById('cfgFilter'),
  cfgOrderBy: document.getElementById('cfgOrderBy'),
  cfgPageSize: document.getElementById('cfgPageSize'),
  cfgFacets: document.getElementById('cfgFacets'),
  boostList: document.getElementById('boostList'),
  addBoostBtn: document.getElementById('addBoostBtn'),

  // Tabs & Views
  tabFormattedBtn: document.getElementById('tabFormattedBtn'),
  tabRawBtn: document.getElementById('tabRawBtn'),
  tabInspectorBtn: document.getElementById('tabInspectorBtn'),
  tabFormattedContent: document.getElementById('tabFormattedContent'),
  tabRawContent: document.getElementById('tabRawContent'),
  tabInspectorContent: document.getElementById('tabInspectorContent'),

  // Results display
  latencyBadge: document.getElementById('latencyBadge'),
  statusCodeBadge: document.getElementById('statusCodeBadge'),
  summaryCard: document.getElementById('summaryCard'),
  summaryText: document.getElementById('summaryText'),
  summaryModelBadge: document.getElementById('summaryModelBadge'),
  summaryReferences: document.getElementById('summaryReferences'),
  extractiveCard: document.getElementById('extractiveCard'),
  extractiveAnswerText: document.getElementById('extractiveAnswerText'),
  facetsCard: document.getElementById('facetsCard'),
  facetsContainer: document.getElementById('facetsContainer'),
  resultsCountText: document.getElementById('resultsCountText'),
  documentList: document.getElementById('documentList'),

  // Raw Viewer
  rawFilterInput: document.getElementById('rawFilterInput'),
  jsonStats: document.getElementById('jsonStats'),
  copyRawBtn: document.getElementById('copyRawBtn'),
  downloadJsonBtn: document.getElementById('downloadJsonBtn'),
  rawJsonCode: document.getElementById('rawJsonCode'),

  // Inspector
  inspectorUrl: document.getElementById('inspectorUrl'),
  inspectorPayload: document.getElementById('inspectorPayload'),
  inspectorCurl: document.getElementById('inspectorCurl'),
  copyRequestPayloadBtn: document.getElementById('copyRequestPayloadBtn'),
  copyCurlBtn: document.getElementById('copyCurlBtn'),

  // Toast
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toastMessage')
};

// Initialize Icons
function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Toast Notification
function showToast(msg) {
  dom.toastMessage.textContent = msg;
  dom.toast.classList.remove('translate-y-20', 'opacity-0');
  dom.toast.classList.add('translate-y-0', 'opacity-100');
  setTimeout(() => {
    dom.toast.classList.remove('translate-y-0', 'opacity-100');
    dom.toast.classList.add('translate-y-20', 'opacity-0');
  }, 2500);
}

// Set Active Mode (Mock vs Live)
function setMode(newMode) {
  state.mode = newMode;
  if (newMode === 'mock') {
    dom.modeMockBtn.className = "px-2.5 py-1 rounded text-xs font-semibold transition-all bg-white text-indigo-600 shadow-sm";
    dom.modeLiveBtn.className = "px-2.5 py-1 rounded text-xs font-medium text-slate-600 transition-all hover:text-slate-900";
    dom.liveAuthBanner.classList.add('hidden');
  } else {
    dom.modeLiveBtn.className = "px-2.5 py-1 rounded text-xs font-semibold transition-all bg-white text-indigo-600 shadow-sm";
    dom.modeMockBtn.className = "px-2.5 py-1 rounded text-xs font-medium text-slate-600 transition-all hover:text-slate-900";
    dom.liveAuthBanner.classList.remove('hidden');
  }
}

// Set Active Tab
function setActiveTab(tabKey) {
  state.activeTab = tabKey;
  const tabs = [
    { key: 'formatted', btn: dom.tabFormattedBtn, content: dom.tabFormattedContent },
    { key: 'raw', btn: dom.tabRawBtn, content: dom.tabRawContent },
    { key: 'inspector', btn: dom.tabInspectorBtn, content: dom.tabInspectorContent }
  ];

  tabs.forEach(t => {
    if (t.key === tabKey) {
      t.btn.className = "tab-btn active px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 transition";
      t.content.classList.remove('hidden');
    } else {
      t.btn.className = "tab-btn px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition flex items-center space-x-1.5";
      t.content.classList.add('hidden');
    }
  });

  initIcons();
}

// Render Boost Specs List
function renderBoostSpecs() {
  dom.boostList.innerHTML = '';
  state.boostSpecs.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = "flex items-center space-x-2 bg-slate-50 p-2 rounded border border-slate-200 text-xs";
    row.innerHTML = `
      <input type="text" value="${escapeHtml(item.condition)}" placeholder="조건 (예: category: ANY('Security'))" class="boost-condition flex-1 px-2 py-1 bg-white border border-slate-200 rounded font-mono text-[11px]">
      <div class="flex items-center space-x-1">
        <span class="text-slate-500 font-medium">부스트:</span>
        <input type="number" step="0.1" min="-1" max="1" value="${item.boost}" class="boost-val w-14 px-1.5 py-1 bg-white border border-slate-200 rounded font-mono text-center text-[11px]">
      </div>
      <button type="button" class="del-boost text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded" title="삭제">
        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
      </button>
    `;

    // Events
    row.querySelector('.boost-condition').addEventListener('input', (e) => {
      state.boostSpecs[index].condition = e.target.value;
    });
    row.querySelector('.boost-val').addEventListener('input', (e) => {
      state.boostSpecs[index].boost = parseFloat(e.target.value) || 0.0;
    });
    row.querySelector('.del-boost').addEventListener('click', () => {
      state.boostSpecs.splice(index, 1);
      renderBoostSpecs();
    });

    dom.boostList.appendChild(row);
  });
  initIcons();
}

// Escape HTML for safe rendering
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Sanitize Snippets (allow only <b> tags for highlight)
function sanitizeSnippet(snippet) {
  if (!snippet) return '';
  // Temporary token replacement for safe <b> and </b>
  let sanitized = snippet
    .replace(/<b>/gi, '___B_OPEN___')
    .replace(/<\/b>/gi, '___B_CLOSE___');
  sanitized = escapeHtml(sanitized);
  return sanitized
    .replace(/___B_OPEN___/g, '<b class="text-indigo-600 font-bold bg-indigo-50 px-1 rounded">')
    .replace(/___B_CLOSE___/g, '</b>');
}

// Apply Preset Configurations
function applyPreset(preset) {
  if (preset === 'summary') {
    dom.summaryEnabled.checked = true;
    dom.summaryResultCount.value = 3;
    dom.summaryCountVal.textContent = "3개";
    dom.summaryIncludeCitations.checked = true;
    dom.summaryPrunedSummary.checked = false;
    dom.extractiveEnabled.checked = true;
    dom.extractiveAnswerCount.value = "1";
    dom.extractiveSegmentCount.value = "1";
    dom.snippetReturnSnippet.checked = true;
    document.querySelector('input[name="searchResultMode"][value="DOCUMENTS"]').checked = true;
    dom.chunkContextRow.classList.add('hidden');
    dom.cfgFilter.value = '';
  } else if (preset === 'extractive') {
    dom.summaryEnabled.checked = false;
    dom.extractiveEnabled.checked = true;
    dom.extractiveAnswerCount.value = "2";
    dom.extractiveSegmentCount.value = "3";
    dom.extractiveReturnScore.checked = true;
    dom.extractivePrevSegments.value = "1";
    dom.extractiveNextSegments.value = "1";
    dom.snippetReturnSnippet.checked = true;
  } else if (preset === 'chunk') {
    dom.summaryEnabled.checked = true;
    dom.summarySemanticChunks.checked = true;
    document.querySelector('input[name="searchResultMode"][value="CHUNKS"]').checked = true;
    dom.chunkContextRow.classList.remove('hidden');
    dom.chunkPrev.value = "1";
    dom.chunkNext.value = "1";
    dom.extractiveEnabled.checked = false;
  } else if (preset === 'facet_boost') {
    dom.cfgFilter.value = 'category: ANY("Architecture", "Security")';
    dom.cfgFacets.value = 'category, author, file_type';
    state.boostSpecs = [
      { condition: 'category: ANY("Security")', boost: 0.8 },
      { condition: 'author: ANY("Cloud CoE")', boost: 0.5 }
    ];
    renderBoostSpecs();
  } else if (preset === 'minimal') {
    dom.summaryEnabled.checked = false;
    dom.extractiveEnabled.checked = false;
    dom.snippetReturnSnippet.checked = true;
    dom.snippetMaxCount.value = "1";
    dom.cfgFilter.value = '';
    state.boostSpecs = [];
    renderBoostSpecs();
  }

  // Update summary section disabled appearance
  dom.secSummaryBody.style.opacity = dom.summaryEnabled.checked ? '1' : '0.4';
  dom.secSummaryBody.style.pointerEvents = dom.summaryEnabled.checked ? 'auto' : 'none';
  dom.secExtractiveBody.style.opacity = dom.extractiveEnabled.checked ? '1' : '0.4';
  dom.secExtractiveBody.style.pointerEvents = dom.extractiveEnabled.checked ? 'auto' : 'none';

  showToast(`'${preset}' 프리셋이 적용되었습니다.`);
}

// Build SearchConfig Object from UI
function collectSearchConfig() {
  const resultMode = document.querySelector('input[name="searchResultMode"]:checked')?.value || 'DOCUMENTS';

  const facetsList = dom.cfgFacets.value
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0);

  return {
    project_id: dom.cfgProjectId.value.trim(),
    location: dom.cfgLocation.value.trim(),
    resource_type: dom.cfgResourceType.value,
    resource_id: dom.cfgResourceId.value.trim(),
    serving_config_id: dom.cfgServingConfigId.value.trim(),
    api_version: dom.cfgApiVersion.value,
    mode: state.mode,
    custom_token: dom.cfgCustomToken.value.trim() || null,
    quota_project: dom.cfgQuotaProject.value.trim() || null,

    query: dom.queryInput.value.trim(),
    page_size: parseInt(dom.cfgPageSize.value, 10) || 10,
    offset: 0,
    filter: dom.cfgFilter.value.trim() || null,
    order_by: dom.cfgOrderBy.value.trim() || null,

    summary_spec: {
      enabled: dom.summaryEnabled.checked,
      summary_result_count: parseInt(dom.summaryResultCount.value, 10) || 3,
      include_citations: dom.summaryIncludeCitations.checked,
      generate_pruned_summary: dom.summaryPrunedSummary.checked,
      ignore_adversarial_query: dom.summaryIgnoreAdversarial.checked,
      ignore_non_summary_seeking_query: dom.summaryIgnoreNonSeeking.checked,
      ignore_low_relevant_content: dom.summaryIgnoreLowRelevant.checked,
      language_code: dom.summaryLanguageCode.value || null,
      model_version: dom.summaryModelVersion.value || null,
      model_prompt_preamble: dom.summaryPreamble.value.trim() || null,
      use_semantic_chunks: dom.summarySemanticChunks.checked
    },

    extractive_spec: {
      enabled: dom.extractiveEnabled.checked,
      max_extractive_answer_count: parseInt(dom.extractiveAnswerCount.value, 10) || 0,
      max_extractive_segment_count: parseInt(dom.extractiveSegmentCount.value, 10) || 0,
      return_extractive_segment_score: dom.extractiveReturnScore.checked,
      num_previous_segments: parseInt(dom.extractivePrevSegments.value, 10) || 0,
      num_next_segments: parseInt(dom.extractiveNextSegments.value, 10) || 0
    },

    snippet_spec: {
      return_snippet: dom.snippetReturnSnippet.checked,
      max_snippet_count: parseInt(dom.snippetMaxCount.value, 10) || 2
    },

    search_result_mode: resultMode,
    chunk_spec: {
      num_previous_chunks: parseInt(dom.chunkPrev.value, 10) || 0,
      num_next_chunks: parseInt(dom.chunkNext.value, 10) || 0
    },

    query_expansion_spec: {
      condition: dom.qeCondition.value,
      pin_unexpanded_results: dom.qePinUnexpanded.checked
    },

    spell_correction_spec: {
      mode: dom.spellCorrection.value
    },

    nl_understanding_spec: {
      filter_extraction_condition: dom.nlFilterExtraction.value,
      geo_search_condition: "DISABLED"
    },

    boost_specs: state.boostSpecs.filter(b => b.condition && b.condition.trim().length > 0),
    facet_specs: facetsList
  };
}

// Syntax Highlight JSON
function syntaxHighlightJson(json) {
  if (typeof json !== 'string') {
    json = JSON.stringify(json, null, 2);
  }
  json = escapeHtml(json);
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match) {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

// Render Summary with Clickable Citations
function renderSummary(summaryData) {
  if (!summaryData || !summaryData.summaryText) {
    dom.summaryCard.classList.add('hidden');
    return;
  }

  dom.summaryCard.classList.remove('hidden');
  let rawText = summaryData.summaryText;

  // Format markdown bolding: **text** -> <strong>text</strong>
  rawText = escapeHtml(rawText);
  rawText = rawText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  rawText = rawText.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

  // Replace [1], [2], [3] with clickable citation buttons
  const citationReplaced = rawText.replace(/\[(\d+)\]/g, (match, p1) => {
    return `<button class="citation-pill" data-ref-index="${parseInt(p1, 10) - 1}" title="문서 ${p1}번 출처로 이동">[${p1}]</button>`;
  });

  dom.summaryText.innerHTML = citationReplaced;

  // Click event on citation pills to scroll & highlight document card
  dom.summaryText.querySelectorAll('.citation-pill').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = e.currentTarget.getAttribute('data-ref-index');
      const targetCard = document.getElementById(`doc-card-${idx}`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetCard.classList.add('highlight-target');
        setTimeout(() => targetCard.classList.remove('highlight-target'), 2500);
      }
    });
  });

  // Render References Chips
  const references = summaryData.summaryWithMetadata?.references || [];
  dom.summaryReferences.innerHTML = `
    <span class="font-medium text-slate-400 mr-1 flex items-center">
      <i data-lucide="bookmark" class="w-3.5 h-3.5 mr-1"></i>참조 문서 (${references.length}개):
    </span>
  `;

  if (references.length > 0) {
    references.forEach((ref, idx) => {
      const chip = document.createElement('button');
      chip.className = "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md text-[11px] font-medium transition flex items-center space-x-1";
      chip.innerHTML = `<span>[${idx + 1}]</span> <span class="truncate max-w-xs">${escapeHtml(ref.title || ref.document)}</span>`;
      chip.addEventListener('click', () => {
        const targetCard = document.getElementById(`doc-card-${idx}`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetCard.classList.add('highlight-target');
          setTimeout(() => targetCard.classList.remove('highlight-target'), 2500);
        }
      });
      dom.summaryReferences.appendChild(chip);
    });
  } else {
    dom.summaryReferences.classList.add('hidden');
  }
}

// Render Extractive QA Section
function renderExtractive(results) {
  let firstAnswer = null;
  for (const item of results) {
    const answers = item.document?.derivedStructData?.extractive_answers || [];
    if (answers.length > 0 && answers[0].content) {
      firstAnswer = answers[0].content;
      break;
    }
  }

  if (firstAnswer && dom.extractiveEnabled.checked) {
    dom.extractiveCard.classList.remove('hidden');
    dom.extractiveAnswerText.textContent = firstAnswer;
  } else {
    dom.extractiveCard.classList.add('hidden');
  }
}

// Render Facets Chips
function renderFacets(facets) {
  if (!facets || facets.length === 0) {
    dom.facetsCard.classList.add('hidden');
    return;
  }

  dom.facetsCard.classList.remove('hidden');
  dom.facetsContainer.innerHTML = '';

  facets.forEach(f => {
    const group = document.createElement('div');
    group.className = "flex items-center space-x-1.5 mr-3 mb-1.5";
    const label = document.createElement('span');
    label.className = "font-bold text-slate-500 font-mono text-[11px]";
    label.textContent = `${f.key}:`;
    group.appendChild(label);

    (f.values || []).forEach(v => {
      const chip = document.createElement('span');
      chip.className = "bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 text-[11px] flex items-center space-x-1";
      chip.innerHTML = `<span>${escapeHtml(v.value)}</span> <span class="bg-slate-200 text-slate-600 font-mono text-[10px] px-1 rounded-full">${v.count}</span>`;
      group.appendChild(chip);
    });

    dom.facetsContainer.appendChild(group);
  });
}

// Render Document Cards List
function renderDocumentList(results) {
  dom.documentList.innerHTML = '';

  if (!results || results.length === 0) {
    dom.documentList.innerHTML = `
      <div class="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
        <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
        <p class="font-medium text-sm">검색 결과가 없습니다.</p>
        <p class="text-xs mt-1">검색어를 수정하거나 필터/부스트 조건을 확인해보세요.</p>
      </div>
    `;
    dom.resultsCountText.textContent = "검색된 문서 (0개)";
    initIcons();
    return;
  }

  dom.resultsCountText.textContent = `검색된 문서 (${results.length}개)`;

  results.forEach((item, index) => {
    const doc = item.document || {};
    const derived = doc.derivedStructData || {};
    const struct = doc.structData || {};

    const title = derived.title || struct.title || doc.name?.split('/').pop() || `Document #${index + 1}`;
    const link = derived.link || doc.name || '#';
    const snippets = derived.snippets || [];
    const segments = derived.extractive_segments || [];
    const answers = derived.extractive_answers || [];

    const card = document.createElement('div');
    card.id = `doc-card-${index}`;
    card.className = "bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3 transition hover:border-indigo-300";

    // Header with Title and Badges
    let headerHtml = `
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-2">
          <span class="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200">${index + 1}</span>
          <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="font-bold text-sm text-indigo-600 hover:text-indigo-800 hover:underline flex items-center space-x-1">
            <span>${escapeHtml(title)}</span>
            <i data-lucide="external-link" class="w-3 h-3 text-slate-400"></i>
          </a>
        </div>
    `;

    // Relevance score if segment available
    if (segments.length > 0 && segments[0].relevanceScore !== undefined) {
      headerHtml += `
        <span class="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
          점수: ${(segments[0].relevanceScore * 100).toFixed(1)}%
        </span>
      `;
    }
    headerHtml += `</div>`;

    // Document URI badge
    if (link && link !== '#') {
      headerHtml += `
        <div class="text-[11px] text-slate-400 font-mono truncate">
          ${escapeHtml(link)}
        </div>
      `;
    }

    card.innerHTML = headerHtml;

    // Snippets Section
    if (snippets.length > 0) {
      const snippetBox = document.createElement('div');
      snippetBox.className = "text-xs text-slate-600 leading-relaxed";
      snippets.forEach(s => {
        const p = document.createElement('p');
        p.className = "mb-1";
        p.innerHTML = sanitizeSnippet(s.snippet);
        snippetBox.appendChild(p);
      });
      card.appendChild(snippetBox);
    }

    // Extractive Segments Section
    if (segments.length > 0) {
      const segBox = document.createElement('div');
      segBox.className = "bg-emerald-50/50 border-l-2 border-emerald-500 pl-3 py-1.5 pr-2 text-xs text-emerald-900 rounded-r";
      segBox.innerHTML = `
        <span class="font-semibold text-[10px] uppercase tracking-wide text-emerald-700 block mb-0.5">추출된 문맥 단락 (Extractive Segment)</span>
        <p class="leading-relaxed">${escapeHtml(segments[0].content)}</p>
      `;
      card.appendChild(segBox);
    }

    // Metadata & StructData Drawer
    const structKeys = Object.keys(struct);
    if (structKeys.length > 0) {
      const details = document.createElement('details');
      details.className = "text-xs pt-1 border-t border-slate-100";
      details.innerHTML = `
        <summary class="cursor-pointer text-slate-400 hover:text-slate-600 font-medium text-[11px] select-none py-1 flex items-center space-x-1">
          <i data-lucide="code" class="w-3 h-3"></i>
          <span>메타데이터 (StructData) 확인 (${structKeys.length}개 필드)</span>
        </summary>
        <div class="mt-2 p-2.5 bg-slate-50 rounded border border-slate-200 font-mono text-[11px] text-slate-700 overflow-x-auto">
          <pre>${escapeHtml(JSON.stringify(struct, null, 2))}</pre>
        </div>
      `;
      card.appendChild(details);
    }

    dom.documentList.appendChild(card);
  });

  initIcons();
}

// Render Raw Data Tab (Syntax Highlighted JSON)
function renderRawData(fullResponse) {
  state.lastResponseData = fullResponse;
  const jsonStr = JSON.stringify(fullResponse, null, 2);

  // Stats
  const byteLength = new Blob([jsonStr]).size;
  dom.jsonStats.textContent = `크기: ${(byteLength / 1024).toFixed(1)} KB`;

  // Syntax highlight
  dom.rawJsonCode.innerHTML = syntaxHighlightJson(fullResponse);
}

// Filter Raw JSON viewer
function filterRawJson(searchTerm) {
  if (!state.lastResponseData) return;
  const jsonStr = JSON.stringify(state.lastResponseData, null, 2);

  if (!searchTerm || !searchTerm.trim()) {
    dom.rawJsonCode.innerHTML = syntaxHighlightJson(state.lastResponseData);
    return;
  }

  const term = searchTerm.trim().toLowerCase();
  const lines = jsonStr.split('\n');
  const highlightedLines = lines.map(line => {
    if (line.toLowerCase().includes(term)) {
      return `<mark class="bg-amber-300 text-slate-950 font-bold">${escapeHtml(line)}</mark>`;
    }
    return escapeHtml(line);
  });

  dom.rawJsonCode.innerHTML = highlightedLines.join('\n');
}

// Render Inspector Tab
function renderInspector(endpointUrl, payload, curlCommand) {
  state.lastEndpointUrl = endpointUrl;
  state.lastRequestPayload = payload;
  state.lastCurlCommand = curlCommand;

  dom.inspectorUrl.textContent = endpointUrl;
  dom.inspectorPayload.textContent = JSON.stringify(payload, null, 2);
  dom.inspectorCurl.textContent = curlCommand;
}

// Execute Search Request
async function performSearch() {
  const query = dom.queryInput.value.trim();
  if (!query) {
    showToast('검색어를 입력해 주세요.');
    dom.queryInput.focus();
    return;
  }

  // Loading state
  dom.searchBtn.disabled = true;
  dom.searchBtn.classList.add('opacity-75', 'cursor-not-allowed');
  dom.searchBtn.querySelector('span').textContent = "검색 중...";

  const config = collectSearchConfig();

  try {
    const startTime = performance.now();
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });

    const data = await res.json();
    const clientLatency = Math.round(performance.now() - startTime);

    // Update Status Indicators
    dom.latencyBadge.textContent = `${data.latency_ms || clientLatency}ms`;
    if (data.status_code === 200) {
      dom.statusCodeBadge.className = "font-mono text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold";
      dom.statusCodeBadge.textContent = "200 OK";
    } else {
      dom.statusCodeBadge.className = "font-mono text-[11px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-semibold";
      dom.statusCodeBadge.textContent = `${data.status_code} ERROR`;
    }

    if (data.error) {
      showToast(`오류: ${data.error}`);
    }

    // 1. Render Formatted View
    const searchResp = data.response || {};
    renderSummary(searchResp.summary);
    renderExtractive(searchResp.results || []);
    renderFacets(searchResp.facets || []);
    renderDocumentList(searchResp.results || []);

    // 2. Render Raw Data View
    renderRawData(searchResp);

    // 3. Render Inspector View
    renderInspector(data.endpoint_url, data.request_payload, data.curl_command);

  } catch (err) {
    showToast(`네트워크 오류가 발생했습니다: ${err.message}`);
    dom.statusCodeBadge.className = "font-mono text-[11px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-semibold";
    dom.statusCodeBadge.textContent = "NET ERROR";
  } finally {
    dom.searchBtn.disabled = false;
    dom.searchBtn.classList.remove('opacity-75', 'cursor-not-allowed');
    dom.searchBtn.querySelector('span').textContent = "검색 실행";
  }
}

// Download JSON file
function downloadRawJson() {
  if (!state.lastResponseData) {
    showToast('다운로드할 검색 결과 데이터가 없습니다.');
    return;
  }
  const jsonStr = JSON.stringify(state.lastResponseData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = url;
  a.download = `discovery_engine_response_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('JSON 파일 다운로드가 시작되었습니다.');
}

// Copy to Clipboard helper
async function copyText(text, successMsg) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMsg);
  } catch (e) {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast(successMsg);
  }
}

// Event Listeners Registration
function initEventListeners() {
  // Mode toggling
  dom.modeMockBtn.addEventListener('click', () => setMode('mock'));
  dom.modeLiveBtn.addEventListener('click', () => setMode('live'));

  // Preset Selection
  dom.presetSelect.addEventListener('change', (e) => applyPreset(e.target.value));

  // Search Action
  dom.searchBtn.addEventListener('click', performSearch);
  dom.queryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  // Clear query button
  dom.clearQueryBtn.addEventListener('click', () => {
    dom.queryInput.value = '';
    dom.queryInput.focus();
  });

  // Quick query chips
  document.querySelectorAll('.quick-query-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      dom.queryInput.value = chip.textContent.trim();
      performSearch();
    });
  });

  // Accordion Expand/Collapse
  document.querySelectorAll('.accordion-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const targetEl = document.getElementById(targetId);
      const icon = btn.querySelector('.accordion-icon');
      if (targetEl.classList.contains('hidden')) {
        targetEl.classList.remove('hidden');
        if (icon) icon.style.transform = 'rotate(0deg)';
      } else {
        targetEl.classList.add('hidden');
        if (icon) icon.style.transform = 'rotate(-90deg)';
      }
    });
  });

  // Summary Enable Master Switch
  dom.summaryEnabled.addEventListener('change', (e) => {
    dom.secSummaryBody.style.opacity = e.target.checked ? '1' : '0.4';
    dom.secSummaryBody.style.pointerEvents = e.target.checked ? 'auto' : 'none';
  });

  // Extractive Enable Master Switch
  dom.extractiveEnabled.addEventListener('change', (e) => {
    dom.secExtractiveBody.style.opacity = e.target.checked ? '1' : '0.4';
    dom.secExtractiveBody.style.pointerEvents = e.target.checked ? 'auto' : 'none';
  });

  // Slider change
  dom.summaryResultCount.addEventListener('input', (e) => {
    dom.summaryCountVal.textContent = `${e.target.value}개`;
  });

  // Result Mode Radios
  document.querySelectorAll('input[name="searchResultMode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'CHUNKS') {
        dom.chunkContextRow.classList.remove('hidden');
      } else {
        dom.chunkContextRow.classList.add('hidden');
      }
    });
  });

  // Add Boost Spec Rule
  dom.addBoostBtn.addEventListener('click', () => {
    state.boostSpecs.push({ condition: '', boost: 0.5 });
    renderBoostSpecs();
  });

  // Tab switching
  dom.tabFormattedBtn.addEventListener('click', () => setActiveTab('formatted'));
  dom.tabRawBtn.addEventListener('click', () => setActiveTab('raw'));
  dom.tabInspectorBtn.addEventListener('click', () => setActiveTab('inspector'));

  // Raw Viewer Actions
  dom.rawFilterInput.addEventListener('input', (e) => filterRawJson(e.target.value));
  dom.copyRawBtn.addEventListener('click', () => {
    if (state.lastResponseData) {
      copyText(JSON.stringify(state.lastResponseData, null, 2), '원본 Raw JSON이 복사되었습니다.');
    }
  });
  dom.downloadJsonBtn.addEventListener('click', downloadRawJson);

  // Inspector Actions
  dom.copyRequestPayloadBtn.addEventListener('click', () => {
    if (state.lastRequestPayload) {
      copyText(JSON.stringify(state.lastRequestPayload, null, 2), 'Request Payload가 복사되었습니다.');
    }
  });
  dom.copyCurlBtn.addEventListener('click', () => {
    if (state.lastCurlCommand) {
      copyText(state.lastCurlCommand, 'cURL 명령어가 클립보드에 복사되었습니다.');
    }
  });

  // Global Keyboard Shortcuts: Cmd+Enter or Ctrl+Enter to search
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      performSearch();
    }
  });
}

// Fetch Initial Environment Defaults
async function fetchEnvDefaults() {
  try {
    const res = await fetch('/api/env-info');
    if (res.ok) {
      const info = await res.json();
      if (info.default_project) {
        dom.cfgProjectId.value = info.default_project;
      }
    }
  } catch (e) {
    console.debug('Env info fetch failed', e);
  }
}

// On Document Load
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  initEventListeners();
  renderBoostSpecs();
  fetchEnvDefaults();

  // Perform initial search to show realistic populated data immediately
  performSearch();
});
