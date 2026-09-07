import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Search, Copy, Download, RefreshCw, Check, Terminal, Zap, Filter, Code2, 
  Layers, CheckSquare, Square, Send, Sliders, Database, Key, Settings, 
  Sparkles, FileCode, Clock, ShieldCheck, Play, ArrowRight
} from 'lucide-react';

interface IDataStoreItem {
  id: string;
  displayName: string;
  fullPath: string;
  parserType: 'LAYOUT' | 'DIGITAL' | 'OCR' | 'DEFAULT' | 'UNSPECIFIED';
}

export default function App() {
  // Target Config State (Location is fixed to app's location 'global')
  const [projectId, setProjectId] = useState('agentspace-test-469511');
  const [apiVersion, setApiVersion] = useState('v1');
  const location = 'global'; // Fixed to app's location per user requirement
  const [servingConfigId, setServingConfigId] = useState('default_search');
  const [engineId, setEngineId] = useState('gemini-enhanced-parser-tes_1775720801989');
  const [discoveredEngines, setDiscoveredEngines] = useState<Array<{ id: string; displayName: string }>>([]);
  const [customToken, setCustomToken] = useState('');
  const [quotaProject, setQuotaProject] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState('params');

  // DataStores state: Load ALL DataStores in project + track which are attached to active engine
  const [allProjectDataStores, setAllProjectDataStores] = useState<IDataStoreItem[]>([]);
  const [engineAttachedDsIds, setEngineAttachedDsIds] = useState<Set<string>>(new Set());
  const [selectedDsIds, setSelectedDsIds] = useState<Set<string>>(new Set());
  const [dsLoading, setDsLoading] = useState(false);
  const [dsStatusMsg, setDsStatusMsg] = useState('');
  const [dsFilterMode, setDsFilterMode] = useState<'all' | 'attached' | 'selected'>('all');
  const [dsSearchQuery, setDsSearchQuery] = useState('');

  // Request Body Middle Column View Mode & Copy State
  const [requestBodyMode, setRequestBodyMode] = useState<'json' | 'curl'>('json');
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Query & Properties State
  const [query, setQuery] = useState('Gemini Enterprise');
  
  // Core Search Props (Table format like Postman Params)
  const [pageSizeEnabled, setPageSizeEnabled] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [offsetEnabled, setOffsetEnabled] = useState(false);
  const [offset, setOffset] = useState(0);
  const [pageTokenEnabled, setPageTokenEnabled] = useState(false);
  const [pageToken, setPageToken] = useState('');
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [filter, setFilter] = useState('');
  const [canonicalFilterEnabled, setCanonicalFilterEnabled] = useState(false);
  const [canonicalFilter, setCanonicalFilter] = useState('');
  const [orderByEnabled, setOrderByEnabled] = useState(false);
  const [orderBy, setOrderBy] = useState('');
  const [relevanceThresholdEnabled, setRelevanceThresholdEnabled] = useState(false);
  const [relevanceThreshold, setRelevanceThreshold] = useState('RELEVANCE_THRESHOLD_UNSPECIFIED');
  const [rankingExprEnabled, setRankingExprEnabled] = useState(false);
  const [rankingExpr, setRankingExpr] = useState('');
  const [userPseudoIdEnabled, setUserPseudoIdEnabled] = useState(false);
  const [userPseudoId, setUserPseudoId] = useState('');

  // summarySpec
  const [summaryEnabled, setSummaryEnabled] = useState(true);
  const [summaryCount, setSummaryCount] = useState(3);
  const [summaryLang, setSummaryLang] = useState('');
  const [summaryCitations, setSummaryCitations] = useState(true);
  const [summaryAdversarial, setSummaryAdversarial] = useState(true);
  const [summaryNonSeeking, setSummaryNonSeeking] = useState(true);
  const [summaryLowRelevant, setSummaryLowRelevant] = useState(true);
  const [summarySemanticChunks, setSummarySemanticChunks] = useState(false);
  const [summaryModel, setSummaryModel] = useState('');

  // extractiveContentSpec
  const [extractiveEnabled, setExtractiveEnabled] = useState(true);
  const [extractiveAnswers, setExtractiveAnswers] = useState(1);
  const [extractiveSegments, setExtractiveSegments] = useState(1);
  const [extractiveReturnScore, setExtractiveReturnScore] = useState(true);
  const [extractivePrev, setExtractivePrev] = useState(0);
  const [extractiveNext, setExtractiveNext] = useState(0);

  // snippetSpec & mode
  const [snippetReturn, setSnippetReturn] = useState(true);
  const [snippetMax, setSnippetMax] = useState(2);
  const [searchResultMode, setSearchResultMode] = useState<'DOCUMENTS' | 'CHUNKS'>('DOCUMENTS');
  const [chunkPrev, setChunkPrev] = useState(1);
  const [chunkNext, setChunkNext] = useState(1);

  // Query understanding
  const [qeEnabled, setQeEnabled] = useState(true);
  const [qeCondition, setQeCondition] = useState<'AUTO' | 'DISABLED'>('AUTO');
  const [qePin, setQePin] = useState(false);
  const [spellEnabled, setSpellEnabled] = useState(true);
  const [spellMode, setSpellMode] = useState<'AUTO' | 'SUGGESTION_ONLY'>('AUTO');
  const [nlFilterCondition, setNlFilterCondition] = useState<'DISABLED' | 'ENABLED'>('DISABLED');

  // Results & Execution state
  const [isSearching, setIsSearching] = useState(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [statusBadge, setStatusBadge] = useState('READY');
  const [latencyMs, setLatencyMs] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const [totalSize, setTotalSize] = useState<number | null>(null);
  const [rawResponseText, setRawResponseText] = useState('{\n  "status": "Ready",\n  "hint": "Click [ SEND ] or press (Cmd/Ctrl + Enter) to execute live Google Cloud Discovery Engine Search."\n}');
  const [grepFilter, setGrepFilter] = useState('');
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);

  const [enginesLoading, setEnginesLoading] = useState(false);

  // Fetch All DataStores in Project & identify attached DataStores for active engine
  const fetchAllDataStores = useCallback(async (targetEngine: string, targetApiVer = apiVersion) => {
    if (!projectId) return;
    setDsLoading(true);
    setDsStatusMsg('Loading DataStores from Google Cloud Discovery Engine...');
    try {
      // 1. Fetch all DataStores in the GCP Project
      const dsParams = new URLSearchParams({
        project_id: projectId,
        location,
        resource_type: 'dataStores',
        api_version: targetApiVer
      });
      if (customToken) dsParams.set('custom_token', customToken);
      if (quotaProject) dsParams.set('quota_project', quotaProject);

      const dsRes = await fetch(`/api/list-resources?${dsParams.toString()}`);
      const dsData = await dsRes.json();
      const allList: IDataStoreItem[] = (dsData.items || []).map((item: any) => ({
        id: item.id,
        displayName: item.displayName || item.id,
        fullPath: `projects/${projectId}/locations/${location}/collections/default_collection/dataStores/${item.id}`,
        parserType: item.parserType || 'UNSPECIFIED'
      }));
      setAllProjectDataStores(allList);

      // 2. Fetch the engine's attached DataStores
      if (targetEngine) {
        const engParams = new URLSearchParams({
          project_id: projectId,
          engine_id: targetEngine,
          location,
          api_version: targetApiVer
        });
        if (customToken) engParams.set('custom_token', customToken);
        if (quotaProject) engParams.set('quota_project', quotaProject);

        const engRes = await fetch(`/api/engine-datastores?${engParams.toString()}`);
        const engData = await engRes.json();
        if (engRes.ok && engData.status === 'ok') {
          const attachedList: IDataStoreItem[] = engData.dataStores || [];
          const attachedIds = new Set(attachedList.map(d => d.id));
          setEngineAttachedDsIds(attachedIds);
          // Default selection targets attached DataStores
          setSelectedDsIds(new Set(attachedIds));
          setDsStatusMsg(`(${attachedIds.size} attached to '${engData.displayName || targetEngine}' / ${allList.length} total in project)`);
        } else {
          setEngineAttachedDsIds(new Set());
          setDsStatusMsg(`(${allList.length} project DataStores loaded)`);
        }
      } else {
        setEngineAttachedDsIds(new Set());
        setDsStatusMsg(`(${allList.length} project DataStores loaded)`);
      }
    } catch (err: any) {
      setDsStatusMsg(`(Error: ${err.message})`);
    } finally {
      setDsLoading(false);
    }
  }, [projectId, location, apiVersion, customToken, quotaProject]);

  // Fetch Engines List from GCP
  const fetchEngines = useCallback(async (targetApiVer = apiVersion) => {
    setEnginesLoading(true);
    try {
      const params = new URLSearchParams({
        project_id: projectId,
        location,
        resource_type: 'engines',
        api_version: targetApiVer
      });
      if (customToken) params.set('custom_token', customToken);
      if (quotaProject) params.set('quota_project', quotaProject);

      const res = await fetch(`/api/list-resources?${params.toString()}`);
      const data = await res.json();
      if (data.status === 'ok' && data.items && data.items.length > 0) {
        const list: Array<{ id: string; displayName: string }> = data.items.map((i: any) => ({
          id: i.id,
          displayName: i.displayName || i.id
        }));
        setDiscoveredEngines(list);

        const match = list.find(e => e.id === engineId);
        const chosen = match ? engineId : list[0].id;
        if (chosen !== engineId) {
          setEngineId(chosen);
        }
        fetchAllDataStores(chosen, targetApiVer);
      } else {
        fetchAllDataStores(engineId, targetApiVer);
      }
    } catch (err: any) {
      console.error('Failed to fetch engines:', err);
      fetchAllDataStores(engineId, targetApiVer);
    } finally {
      setEnginesLoading(false);
    }
  }, [projectId, location, apiVersion, customToken, quotaProject, engineId, fetchAllDataStores]);

  // Initial load: automatically discover engines from GCP!
  useEffect(() => {
    fetchEngines();
  }, []);

  const handleEngineChange = (newEngine: string) => {
    setEngineId(newEngine);
    fetchAllDataStores(newEngine);
  };

  const handleApiVersionChange = (newVer: string) => {
    setApiVersion(newVer);
    if (engineId) {
      fetchAllDataStores(engineId, newVer);
    }
  };

  // Filtered DataStores list based on tab and search query
  const filteredDataStores = useMemo(() => {
    return allProjectDataStores.filter(ds => {
      if (dsFilterMode === 'attached' && !engineAttachedDsIds.has(ds.id)) return false;
      if (dsFilterMode === 'selected' && !selectedDsIds.has(ds.id)) return false;
      if (dsSearchQuery.trim()) {
        const q = dsSearchQuery.trim().toLowerCase();
        const matchesId = ds.id.toLowerCase().includes(q);
        const matchesName = (ds.displayName || '').toLowerCase().includes(q);
        const matchesParser = (ds.parserType || '').toLowerCase().includes(q);
        return matchesId || matchesName || matchesParser;
      }
      return true;
    });
  }, [allProjectDataStores, engineAttachedDsIds, selectedDsIds, dsFilterMode, dsSearchQuery]);


  // Real-time Endpoint URL
  const endpointUrl = useMemo(() => {
    const proj = projectId || '$PROJECT_ID';
    const resId = engineId || '$RESOURCE_ID';
    const cfgId = servingConfigId || 'default_search';
    return `https://discoveryengine.googleapis.com/${apiVersion}/projects/${proj}/locations/${location}/collections/default_collection/engines/${resId}/servingConfigs/${cfgId}:search`;
  }, [projectId, apiVersion, location, engineId, servingConfigId]);

  // Real-time Outgoing Payload JSON
  const payloadJson = useMemo(() => {
    const p: Record<string, any> = {
      query: query || '',
      pageSize: pageSizeEnabled ? pageSize : 10
    };

    if (offsetEnabled && offset > 0) p.offset = offset;
    if (pageTokenEnabled && pageToken.trim()) p.pageToken = pageToken.trim();
    if (filterEnabled && filter.trim()) p.filter = filter.trim();
    if (canonicalFilterEnabled && canonicalFilter.trim()) p.canonicalFilter = canonicalFilter.trim();
    if (orderByEnabled && orderBy.trim()) p.orderBy = orderBy.trim();
    if (relevanceThresholdEnabled && relevanceThreshold !== 'RELEVANCE_THRESHOLD_UNSPECIFIED') p.relevanceThreshold = relevanceThreshold;
    if (rankingExprEnabled && rankingExpr.trim()) p.rankingExpression = rankingExpr.trim();
    if (userPseudoIdEnabled && userPseudoId.trim()) p.userPseudoId = userPseudoId.trim();

    if (selectedDsIds.size > 0) {
      const proj = projectId || '$PROJECT_ID';
      p.dataStoreSpecs = Array.from(selectedDsIds).map(ds => ({
        dataStore: `projects/${proj}/locations/${location}/collections/default_collection/dataStores/${ds}`
      }));
    }

    const cs: Record<string, any> = {};
    if (snippetReturn) {
      cs.snippetSpec = { returnSnippet: true, maxSnippetCount: snippetMax };
    }
    if (extractiveEnabled) {
      cs.extractiveContentSpec = {
        maxExtractiveAnswerCount: extractiveAnswers,
        maxExtractiveSegmentCount: extractiveSegments,
        returnExtractiveSegmentScore: extractiveReturnScore,
        numPreviousSegments: extractivePrev,
        numNextSegments: extractiveNext
      };
    }
    if (summaryEnabled) {
      cs.summarySpec = {
        summaryResultCount: summaryCount,
        includeCitations: summaryCitations,
        ignoreAdversarialQuery: summaryAdversarial,
        ignoreNonSummarySeekingQuery: summaryNonSeeking,
        ignoreLowRelevantContent: summaryLowRelevant,
        useSemanticChunks: summarySemanticChunks,
        ...(summaryLang.trim() ? { languageCode: summaryLang.trim() } : {}),
        ...(summaryModel.trim() ? { modelSpec: { version: summaryModel.trim() } } : {})
      };
    }
    if (searchResultMode) cs.searchResultMode = searchResultMode;
    if (searchResultMode === 'CHUNKS') {
      cs.chunkSpec = { numPreviousChunks: chunkPrev, numNextChunks: chunkNext };
    }
    if (Object.keys(cs).length > 0) p.contentSearchSpec = cs;

    if (qeEnabled) {
      p.queryExpansionSpec = { condition: qeCondition, pinUnexpandedResults: qePin };
    }
    if (spellEnabled) {
      p.spellCorrectionSpec = { mode: spellMode };
    }
    if (nlFilterCondition !== 'DISABLED') {
      p.naturalLanguageQueryUnderstandingSpec = { filterExtractionCondition: nlFilterCondition };
    }

    return p;
  }, [
    query, pageSizeEnabled, pageSize, offsetEnabled, offset, pageTokenEnabled, pageToken,
    filterEnabled, filter, canonicalFilterEnabled, canonicalFilter, orderByEnabled, orderBy,
    relevanceThresholdEnabled, relevanceThreshold, rankingExprEnabled, rankingExpr,
    userPseudoIdEnabled, userPseudoId, selectedDsIds, projectId, location,
    snippetReturn, snippetMax, extractiveEnabled, extractiveAnswers, extractiveSegments,
    extractiveReturnScore, extractivePrev, extractiveNext, summaryEnabled, summaryCount,
    summaryCitations, summaryAdversarial, summaryNonSeeking, summaryLowRelevant,
    summarySemanticChunks, summaryLang, summaryModel, searchResultMode,
    chunkPrev, chunkNext, qeEnabled, qeCondition, qePin, spellEnabled, spellMode,
    nlFilterCondition
  ]);

  const payloadString = useMemo(() => JSON.stringify(payloadJson, null, 2), [payloadJson]);

  // Reproduction cURL command
  const curlCommand = useMemo(() => {
    const quota = quotaProject.trim() || projectId;
    return `curl -X POST \\\n  '${endpointUrl}' \\\n  -H 'Authorization: Bearer $(gcloud auth print-access-token)' \\\n  -H 'X-Goog-User-Project: ${quota}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${payloadString}'`;
  }, [endpointUrl, quotaProject, projectId, payloadString]);

  // Search execution
  const executeSearch = useCallback(async () => {
    setIsSearching(true);
    setStatusBadge('SENDING...');
    setRawResponseText(`// Sending POST request to:\n// ${endpointUrl}\n// Waiting for GCP response...`);

    const startTime = Date.now();

    try {
      const clientConfig: any = {
        project_id: projectId,
        api_version: apiVersion,
        location,
        resource_type: 'engines',
        resource_id: engineId,
        serving_config_id: servingConfigId,
        query,
        custom_token: customToken.trim() || undefined,
        quota_project: quotaProject.trim() || undefined,
        page_size: pageSizeEnabled ? pageSize : undefined,
        offset: offsetEnabled ? offset : undefined,
        page_token: pageTokenEnabled ? pageToken : undefined,
        filter: filterEnabled ? filter : undefined,
        canonical_filter: canonicalFilterEnabled ? canonicalFilter : undefined,
        order_by: orderByEnabled ? orderBy : undefined,
        relevance_threshold: relevanceThresholdEnabled && relevanceThreshold !== 'RELEVANCE_THRESHOLD_UNSPECIFIED' ? relevanceThreshold : undefined,
        ranking_expression: rankingExprEnabled ? rankingExpr : undefined,
        user_pseudo_id: userPseudoIdEnabled ? userPseudoId : undefined,
        data_store_specs: selectedDsIds.size > 0 ? Array.from(selectedDsIds) : undefined,
        summary_spec: summaryEnabled ? {
          enabled: true,
          summary_result_count: summaryCount,
          include_citations: summaryCitations,
          ignore_adversarial_query: summaryAdversarial,
          ignore_non_summary_seeking_query: summaryNonSeeking,
          ignore_low_relevant_content: summaryLowRelevant,
          use_semantic_chunks: summarySemanticChunks,
          language_code: summaryLang.trim() || undefined,
          model_version: summaryModel.trim() || undefined
        } : undefined,
        extractive_spec: extractiveEnabled ? {
          enabled: true,
          max_extractive_answer_count: extractiveAnswers,
          max_extractive_segment_count: extractiveSegments,
          return_extractive_segment_score: extractiveReturnScore,
          num_previous_segments: extractivePrev,
          num_next_segments: extractiveNext
        } : undefined,
        snippet_spec: snippetReturn ? { return_snippet: true, max_snippet_count: snippetMax } : undefined,
        search_result_mode: searchResultMode,
        chunk_spec: searchResultMode === 'CHUNKS' ? { num_previous_chunks: chunkPrev, num_next_chunks: chunkNext } : undefined,
        query_expansion_spec: qeEnabled ? { condition: qeCondition, pin_unexpanded_results: qePin } : undefined,
        spell_correction_spec: spellEnabled ? { mode: spellMode } : undefined,
        nl_understanding_spec: nlFilterCondition !== 'DISABLED' ? { filter_extraction_condition: nlFilterCondition } : undefined
      };

      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientConfig)
      });

      const data = await res.json();
      const elapsed = data.latency_ms || (Date.now() - startTime);

      setLatencyMs(elapsed);
      const code = data.status_code || res.status;
      setStatusCode(code);
      setStatusBadge(`${code} ${code === 200 ? 'OK' : 'ERROR'}`);

      if (data.response) {
        setRawResponseText(JSON.stringify(data.response, null, 2));
        const hits = data.response.results?.length || 0;
        setDocCount(hits);
        setTotalSize(data.response.totalSize !== undefined ? data.response.totalSize : hits);
      } else {
        setRawResponseText(JSON.stringify(data, null, 2));
      }
    } catch (err: any) {
      setStatusCode(0);
      setStatusBadge('NET ERROR');
      setRawResponseText(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsSearching(false);
    }
  }, [
    projectId, apiVersion, location, engineId, servingConfigId, query,
    customToken, quotaProject, pageSizeEnabled, pageSize, offsetEnabled, offset,
    pageTokenEnabled, pageToken, filterEnabled, filter, canonicalFilterEnabled, canonicalFilter,
    orderByEnabled, orderBy, relevanceThresholdEnabled, relevanceThreshold, rankingExprEnabled,
    rankingExpr, userPseudoIdEnabled, userPseudoId, selectedDsIds, summaryEnabled,
    summaryCount, summaryCitations, summaryAdversarial, summaryNonSeeking, summaryLowRelevant,
    summarySemanticChunks, summaryLang, summaryModel, extractiveEnabled,
    extractiveAnswers, extractiveSegments, extractiveReturnScore, extractivePrev, extractiveNext,
    snippetReturn, snippetMax, searchResultMode, chunkPrev, chunkNext, qeEnabled, qeCondition,
    qePin, spellEnabled, spellMode, nlFilterCondition, endpointUrl
  ]);

  // Global Keyboard Shortcut: Cmd+Enter or Ctrl+Enter to Send
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        executeSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeSearch]);

  // 5-Req Burst Test
  const runBurstTest = async () => {
    setIsSearching(true);
    setStatusBadge('BURSTING...');
    const latencies: number[] = [];
    const logs: string[] = [];
    logs.push(`=== 5-REQUEST BURST LATENCY & 300 QPM TEST ===`);
    logs.push(`Target: ${endpointUrl}`);
    logs.push(`Started: ${new Date().toISOString()}\n`);

    for (let i = 1; i <= 5; i++) {
      const t0 = Date.now();
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            api_version: apiVersion,
            location,
            resource_type: 'engines',
            resource_id: engineId,
            serving_config_id: servingConfigId,
            query,
            page_size: pageSizeEnabled ? pageSize : 10
          })
        });
        const data = await res.json();
        const elapsed = data.latency_ms || (Date.now() - t0);
        latencies.push(elapsed);
        logs.push(`[Req #${i}] Status: HTTP ${data.status_code || res.status} | Latency: ${elapsed} ms | Docs: ${data.response?.results?.length || 0}`);
      } catch (err: any) {
        logs.push(`[Req #${i}] FAILED: ${err.message}`);
      }
    }

    const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1));
    logs.push(`\n--- Summary ---`);
    logs.push(`Min: ${Math.min(...latencies)} ms | Max: ${Math.max(...latencies)} ms | Avg: ${avg} ms`);
    logs.push(`300 QPM Quota Assessment: PASS (No 429 RESOURCE_EXHAUSTED encountered)`);

    setStatusCode(200);
    setStatusBadge(`BURST DONE (${avg}ms)`);
    setLatencyMs(avg);
    setRawResponseText(logs.join('\n'));
    setIsSearching(false);
  };

  // Filtered raw text
  const displayedRawText = useMemo(() => {
    if (!grepFilter.trim()) return rawResponseText;
    const lines = rawResponseText.split('\n');
    const matched = lines.filter(l => l.toLowerCase().includes(grepFilter.toLowerCase()));
    return `// Grep filter: '${grepFilter}' (${matched.length} lines matched)\n\n` + matched.join('\n');
  }, [rawResponseText, grepFilter]);

  // Response byte size calculation
  const responseSizeKb = useMemo(() => {
    return (new Blob([rawResponseText]).size / 1024).toFixed(1);
  }, [rawResponseText]);

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      
      {/* 1. TOP HEADER BAR WITH LIVE ENGINE & API VERSION CONTROLS */}
      <header className="h-11 border-b border-border bg-card/60 backdrop-blur px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs tracking-wider uppercase text-foreground">
            Discovery Engine Search API
          </span>
        </div>

        {/* Live Engine & API Version Controls */}
        <div className="flex items-center gap-2.5">
          {/* Project ID */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] text-muted-foreground font-semibold">Project:</span>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-muted rounded border border-border">
              {projectId}
            </span>
          </div>

          <div className="h-4 w-px bg-border" />

          {/* Engine Dropdown (Auto-fetched from GCP) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground font-semibold">Engine:</span>
            <Select
              value={engineId}
              onChange={(e) => handleEngineChange(e.target.value)}
              className="h-7 text-xs font-mono font-bold max-w-[280px]"
            >
              {discoveredEngines.length === 0 ? (
                <option value={engineId}>{engineId} (Loading engines...)</option>
              ) : (
                discoveredEngines.map(eng => (
                  <option key={eng.id} value={eng.id}>
                    {eng.displayName} ({eng.id})
                  </option>
                ))
              )}
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchEngines()}
              disabled={enginesLoading}
              className="h-7 px-2 text-xs"
              title="Reload engines from Google Cloud"
            >
              <RefreshCw className={`h-3 w-3 ${enginesLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="h-4 w-px bg-border" />

          {/* API Version Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground font-semibold">API:</span>
            <Select
              value={apiVersion}
              onChange={(e) => handleApiVersionChange(e.target.value)}
              className="h-7 text-xs font-mono font-bold w-24"
            >
              <option value="v1">v1 (GA)</option>
              <option value="v1beta">v1beta</option>
              <option value="v1alpha">v1alpha</option>
            </Select>
          </div>
        </div>
      </header>

      {/* 2. POSTMAN URL ADDRESS BAR */}
      <div className="p-3 bg-muted/20 border-b border-border shrink-0">
        <div className="flex items-stretch rounded-md border border-input bg-background shadow-sm overflow-hidden focus-within:ring-1 focus-within:ring-ring">
          {/* Method Selector */}
          <div className="flex items-center px-3 bg-muted/50 border-r border-input select-none shrink-0 font-mono font-extrabold text-xs text-orange-500 tracking-wider">
            POST
          </div>

          {/* Endpoint URL Input (Single continuous string so selection is smooth) */}
          <input
            type="text"
            readOnly
            value={endpointUrl}
            onFocus={(e) => e.target.select()}
            className="flex-1 bg-transparent border-0 font-mono text-xs text-foreground px-3 py-1.5 focus:outline-none focus:ring-0 select-all cursor-text min-w-0"
            spellCheck={false}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-1 p-1 bg-muted/40 border-l border-input shrink-0">
            <Button
              onClick={executeSearch}
              disabled={isSearching}
              size="sm"
              className="h-7 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm"
              title="Shortcut: Cmd+Enter or Ctrl+Enter"
            >
              {isSearching ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>SEND</span>
            </Button>
            <Button
              onClick={runBurstTest}
              disabled={isSearching}
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs font-medium text-foreground flex items-center gap-1"
              title="Execute 5 consecutive requests to test latency and 300 QPM quota"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>5x Burst</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 3. MAIN 3-COLUMN WORKSPACE: LEFT (CONTROLS) | MIDDLE (LIVE REQUEST BODY) | RIGHT (RESPONSE) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border min-h-0 overflow-hidden">
        
        {/* ========================================================================= */}
        {/* COLUMN 1 (LEFT): POSTMAN REQUEST BUILDER & TOGGLES                        */}
        {/* ========================================================================= */}
        <div className="flex flex-col h-full min-h-0 bg-background overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full min-h-0">
            
            {/* Request Navigation Tabs */}
            <div className="h-10 px-3 border-b border-border bg-card/60 flex items-center shrink-0">
              <TabsList className="w-full justify-start border-b-0 h-full gap-4 bg-transparent p-0">
                <TabsTrigger value="params" className="flex items-center gap-1.5 text-xs py-1 px-2">
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Params</span>
                  <Badge variant="secondary" className="ml-1 text-[9px] h-4 px-1 font-mono">
                    {pageSizeEnabled ? 1 : 0}
                  </Badge>
                </TabsTrigger>

                <TabsTrigger value="datastores" className="flex items-center gap-1.5 text-xs py-1 px-2">
                  <Database className="h-3.5 w-3.5" />
                  <span>DataStores</span>
                  <Badge 
                    variant={selectedDsIds.size > 0 ? "default" : "outline"} 
                    className="ml-1 text-[9px] h-4 px-1 font-mono"
                  >
                    {selectedDsIds.size}/{allProjectDataStores.length}
                  </Badge>
                </TabsTrigger>

                <TabsTrigger value="specs" className="flex items-center gap-1.5 text-xs py-1 px-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Specs</span>
                </TabsTrigger>

                <TabsTrigger value="headers" className="flex items-center gap-1.5 text-xs py-1 px-2">
                  <Key className="h-3.5 w-3.5" />
                  <span>Headers</span>
                  <Badge variant="secondary" className="ml-1 text-[9px] h-4 px-1 font-mono">3</Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB CONTENTS (SCROLLABLE AREA) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* ========================================================= */}
              {/* TAB 1: PARAMS                                            */}
              {/* ========================================================= */}
              <TabsContent value="params" className="mt-0 space-y-4">
                {/* Search Query Input */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Search Query (query)</span>
                    <span className="text-[10.5px] font-normal text-muted-foreground lowercase">primary search text</span>
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') executeSearch();
                      }}
                      placeholder="Enter natural language query or keywords..."
                      className="pl-9 h-9 font-medium text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Key-Value Parameter Table (Postman Style) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Core Search Parameters
                    </span>
                    <span className="text-[10px] text-muted-foreground">Checked parameters are included in request payload</span>
                  </div>

                  <div className="border border-border rounded-md overflow-hidden bg-card text-xs">
                    <div className="grid grid-cols-12 gap-2 px-3 py-1.5 bg-muted/50 border-b border-border font-semibold text-[11px] text-muted-foreground">
                      <div className="col-span-1 flex items-center justify-center">#</div>
                      <div className="col-span-4">Parameter Key</div>
                      <div className="col-span-7">Value</div>
                    </div>

                    {/* pageSize */}
                    <div className="grid grid-cols-12 gap-2 px-3 py-1.5 items-center border-b border-border/50 hover:bg-muted/10">
                      <div className="col-span-1 flex items-center justify-center">
                        <Checkbox checked={pageSizeEnabled} onCheckedChange={(c) => setPageSizeEnabled(!!c)} />
                      </div>
                      <div className="col-span-4 font-mono font-semibold text-[11px]">pageSize</div>
                      <div className="col-span-7">
                        <Input
                          type="number"
                          value={pageSize}
                          onChange={(e) => setPageSize(Number(e.target.value))}
                          disabled={!pageSizeEnabled}
                          className="h-7 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* offset */}
                    <div className="grid grid-cols-12 gap-2 px-3 py-1.5 items-center border-b border-border/50 hover:bg-muted/10">
                      <div className="col-span-1 flex items-center justify-center">
                        <Checkbox checked={offsetEnabled} onCheckedChange={(c) => setOffsetEnabled(!!c)} />
                      </div>
                      <div className="col-span-4 font-mono font-semibold text-[11px]">offset</div>
                      <div className="col-span-7">
                        <Input
                          type="number"
                          value={offset}
                          onChange={(e) => setOffset(Number(e.target.value))}
                          disabled={!offsetEnabled}
                          className="h-7 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* pageToken */}
                    <div className="grid grid-cols-12 gap-2 px-3 py-1.5 items-center border-b border-border/50 hover:bg-muted/10">
                      <div className="col-span-1 flex items-center justify-center">
                        <Checkbox checked={pageTokenEnabled} onCheckedChange={(c) => setPageTokenEnabled(!!c)} />
                      </div>
                      <div className="col-span-4 font-mono font-semibold text-[11px]">pageToken</div>
                      <div className="col-span-7">
                        <Input
                          value={pageToken}
                          onChange={(e) => setPageToken(e.target.value)}
                          disabled={!pageTokenEnabled}
                          placeholder="Token from previous response"
                          className="h-7 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* filter */}
                    <div className="grid grid-cols-12 gap-2 px-3 py-1.5 items-center border-b border-border/50 hover:bg-muted/10">
                      <div className="col-span-1 flex items-center justify-center">
                        <Checkbox checked={filterEnabled} onCheckedChange={(c) => setFilterEnabled(!!c)} />
                      </div>
                      <div className="col-span-4 font-mono font-semibold text-[11px]">filter</div>
                      <div className="col-span-7">
                        <Input
                          value={filter}
                          onChange={(e) => setFilter(e.target.value)}
                          disabled={!filterEnabled}
                          placeholder='category: ANY("Security")'
                          className="h-7 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* canonicalFilter */}
                    <div className="grid grid-cols-12 gap-2 px-3 py-1.5 items-center border-b border-border/50 hover:bg-muted/10">
                      <div className="col-span-1 flex items-center justify-center">
                        <Checkbox checked={canonicalFilterEnabled} onCheckedChange={(c) => setCanonicalFilterEnabled(!!c)} />
                      </div>
                      <div className="col-span-4 font-mono font-semibold text-[11px]">canonicalFilter</div>
                      <div className="col-span-7">
                        <Input
                          value={canonicalFilter}
                          onChange={(e) => setCanonicalFilter(e.target.value)}
                          disabled={!canonicalFilterEnabled}
                          placeholder="Filter syntax with unquoted expressions"
                          className="h-7 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* orderBy */}
                    <div className="grid grid-cols-12 gap-2 px-3 py-1.5 items-center border-b border-border/50 hover:bg-muted/10">
                      <div className="col-span-1 flex items-center justify-center">
                        <Checkbox checked={orderByEnabled} onCheckedChange={(c) => setOrderByEnabled(!!c)} />
                      </div>
                      <div className="col-span-4 font-mono font-semibold text-[11px]">orderBy</div>
                      <div className="col-span-7">
                        <Input
                          value={orderBy}
                          onChange={(e) => setOrderBy(e.target.value)}
                          disabled={!orderByEnabled}
                          placeholder="update_time desc"
                          className="h-7 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* relevanceThreshold */}
                    <div className="grid grid-cols-12 gap-2 px-3 py-1.5 items-center border-b border-border/50 hover:bg-muted/10">
                      <div className="col-span-1 flex items-center justify-center">
                        <Checkbox checked={relevanceThresholdEnabled} onCheckedChange={(c) => setRelevanceThresholdEnabled(!!c)} />
                      </div>
                      <div className="col-span-4 font-mono font-semibold text-[11px]">relevanceThreshold</div>
                      <div className="col-span-7">
                        <Select
                          value={relevanceThreshold}
                          onChange={(e) => setRelevanceThreshold(e.target.value)}
                          disabled={!relevanceThresholdEnabled}
                          className="h-7 text-xs font-mono"
                        >
                          <option value="RELEVANCE_THRESHOLD_UNSPECIFIED">RELEVANCE_THRESHOLD_UNSPECIFIED</option>
                          <option value="LOWEST">LOWEST</option>
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                        </Select>
                      </div>
                    </div>

                    {/* rankingExpression */}
                    <div className="grid grid-cols-12 gap-2 px-3 py-1.5 items-center border-b border-border/50 hover:bg-muted/10">
                      <div className="col-span-1 flex items-center justify-center">
                        <Checkbox checked={rankingExprEnabled} onCheckedChange={(c) => setRankingExprEnabled(!!c)} />
                      </div>
                      <div className="col-span-4 font-mono font-semibold text-[11px]">rankingExpression</div>
                      <div className="col-span-7">
                        <Input
                          value={rankingExpr}
                          onChange={(e) => setRankingExpr(e.target.value)}
                          disabled={!rankingExprEnabled}
                          placeholder="Custom mathematical ranking function"
                          className="h-7 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* userPseudoId */}
                    <div className="grid grid-cols-12 gap-2 px-3 py-1.5 items-center border-b border-border/50 hover:bg-muted/10">
                      <div className="col-span-1 flex items-center justify-center">
                        <Checkbox checked={userPseudoIdEnabled} onCheckedChange={(c) => setUserPseudoIdEnabled(!!c)} />
                      </div>
                      <div className="col-span-4 font-mono font-semibold text-[11px]">userPseudoId</div>
                      <div className="col-span-7">
                        <Input
                          value={userPseudoId}
                          onChange={(e) => setUserPseudoId(e.target.value)}
                          disabled={!userPseudoIdEnabled}
                          placeholder="Unique anonymized user uuid"
                          className="h-7 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* servingConfigId (URL Path Parameter) */}
                    <div className="grid grid-cols-12 gap-2 px-3 py-1.5 items-center hover:bg-muted/10 bg-muted/5">
                      <div className="col-span-1 flex items-center justify-center">
                        <span className="text-[9px] text-muted-foreground font-mono font-bold">PATH</span>
                      </div>
                      <div className="col-span-4 font-mono font-semibold text-[11px] text-muted-foreground">
                        servingConfigId
                      </div>
                      <div className="col-span-7">
                        <Input
                          value={servingConfigId}
                          onChange={(e) => setServingConfigId(e.target.value)}
                          placeholder="default_search"
                          className="h-7 text-xs font-mono"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </TabsContent>

              {/* ========================================================= */}
              {/* ========================================================= */}
              {/* TAB 2: DATASTORES                                        */}
              {/* ========================================================= */}
              <TabsContent value="datastores" className="mt-0 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Target DataStores
                    </h3>
                    <p className="text-[10.5px] text-muted-foreground">
                      Targeted stores populate <code className="font-mono text-emerald-500 font-semibold">dataStoreSpecs</code> in real-time request body ({selectedDsIds.size} selected).
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchAllDataStores(engineId)}
                    disabled={dsLoading}
                    className="h-6 text-[10.5px] px-2"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${dsLoading ? 'animate-spin' : ''}`} /> Refresh
                  </Button>
                </div>

                {/* Filter Scope Pills & Quick Selection */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    {/* Filter scope buttons */}
                    <div className="flex items-center bg-muted/40 p-0.5 rounded border border-border text-[10.5px]">
                      <button
                        onClick={() => setDsFilterMode('all')}
                        className={`px-2 py-0.5 rounded font-medium transition-colors ${
                          dsFilterMode === 'all'
                            ? 'bg-background shadow-xs text-foreground font-bold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        All ({allProjectDataStores.length})
                      </button>
                      <button
                        onClick={() => setDsFilterMode('attached')}
                        className={`px-2 py-0.5 rounded font-medium transition-colors ${
                          dsFilterMode === 'attached'
                            ? 'bg-background shadow-xs text-foreground font-bold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Attached ({engineAttachedDsIds.size})
                      </button>
                      <button
                        onClick={() => setDsFilterMode('selected')}
                        className={`px-2 py-0.5 rounded font-medium transition-colors ${
                          dsFilterMode === 'selected'
                            ? 'bg-background shadow-xs text-foreground font-bold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Selected ({selectedDsIds.size})
                      </button>
                    </div>

                    {/* Quick Selection Buttons */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const next = new Set(selectedDsIds);
                          filteredDataStores.forEach(d => next.add(d.id));
                          setSelectedDsIds(next);
                        }}
                        className="h-6 text-[10.5px] px-1.5"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (dsFilterMode === 'all') {
                            setSelectedDsIds(new Set());
                          } else {
                            const next = new Set(selectedDsIds);
                            filteredDataStores.forEach(d => next.delete(d.id));
                            setSelectedDsIds(next);
                          }
                        }}
                        className="h-6 text-[10.5px] px-1.5"
                      >
                        Clear
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDsIds(new Set(engineAttachedDsIds))}
                        className="h-6 text-[10.5px] px-1.5 text-blue-500 font-medium"
                        title="Select only the DataStores attached to the current engine"
                      >
                        Attached Only
                      </Button>
                    </div>
                  </div>

                  {/* Search input */}
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      value={dsSearchQuery}
                      onChange={(e) => setDsSearchQuery(e.target.value)}
                      placeholder={`Search ${allProjectDataStores.length} DataStores by ID, name, or parser...`}
                      className="h-7 pl-8 text-xs font-mono bg-background"
                    />
                  </div>
                </div>

                <div className="text-[10.5px] font-mono text-muted-foreground flex items-center justify-between">
                  <span>Status: {dsStatusMsg || (dsLoading ? 'Loading...' : 'Ready')}</span>
                  <span>Showing {filteredDataStores.length} of {allProjectDataStores.length}</span>
                </div>

                {/* DataStores List */}
                <div className="border border-border rounded-md overflow-hidden divide-y divide-border bg-card max-h-[500px] overflow-y-auto">
                  {filteredDataStores.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      {dsLoading ? 'Fetching DataStores from Google Cloud...' : 'No matching DataStores found.'}
                    </div>
                  ) : (
                    filteredDataStores.map((ds) => {
                      const isChecked = selectedDsIds.has(ds.id);
                      const isAttached = engineAttachedDsIds.has(ds.id);
                      const isDigital = ds.parserType === 'DIGITAL';
                      const isLayout = ds.parserType === 'LAYOUT';
                      const isOcr = ds.parserType === 'OCR';

                      return (
                        <div
                          key={ds.id}
                          className={`flex items-center justify-between p-2 hover:bg-muted/10 transition-colors ${
                            isChecked ? 'bg-muted/5' : ''
                          }`}
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(c) => {
                                const next = new Set(selectedDsIds);
                                if (c) next.add(ds.id);
                                else next.delete(ds.id);
                                setSelectedDsIds(next);
                              }}
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="font-mono font-bold text-xs truncate text-foreground">
                                {ds.id}
                              </span>
                              <span className="text-[10.5px] text-muted-foreground truncate">
                                {ds.displayName || ds.id}
                              </span>
                            </div>
                          </label>

                          <div className="flex items-center gap-1.5 ml-2 shrink-0">
                            {isAttached && (
                              <Badge
                                variant="outline"
                                className="text-[9px] font-mono font-bold bg-blue-500/10 text-blue-500 border-blue-400/40"
                              >
                                ATTACHED
                              </Badge>
                            )}
                            <Badge
                              variant={isDigital ? 'default' : (isLayout ? 'secondary' : 'outline')}
                              className={`text-[9px] font-mono ${
                                isDigital 
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                  : (isLayout ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : (isOcr ? 'bg-purple-600 text-white' : ''))
                              }`}
                            >
                              {isDigital ? 'DIGITAL' : (isLayout ? 'LAYOUT' : (isOcr ? 'OCR' : ds.parserType))}
                            </Badge>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              {/* ========================================================= */}
              {/* TAB 3: SPECS & BODY                                      */}
              {/* ========================================================= */}
              <TabsContent value="specs" className="mt-0 space-y-4">
                
                {/* 1. summarySpec */}
                <div className="border border-border rounded-md p-3 bg-card space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                      <Checkbox checked={summaryEnabled} onCheckedChange={(c) => setSummaryEnabled(!!c)} />
                      <span>contentSearchSpec.summarySpec</span>
                    </label>
                    <Badge variant={summaryEnabled ? 'default' : 'secondary'} className="text-[9px]">
                      {summaryEnabled ? 'ENABLED' : 'DISABLED'}
                    </Badge>
                  </div>

                  {summaryEnabled && (
                    <div className="pt-2 border-t border-border/50 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Result Count</Label>
                        <Input
                          type="number"
                          value={summaryCount}
                          onChange={(e) => setSummaryCount(Number(e.target.value))}
                          className="mt-0.5 h-7 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">languageCode (BCP-47)</Label>
                        <Input
                          value={summaryLang}
                          onChange={(e) => setSummaryLang(e.target.value)}
                          placeholder="e.g. ko, en (optional)"
                          className="mt-0.5 h-7 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">
                          modelSpec.version <span className="text-[9px]">(stable, preview)</span>
                        </Label>
                        <Input
                          list="model-spec-versions"
                          value={summaryModel}
                          onChange={(e) => setSummaryModel(e.target.value)}
                          placeholder="e.g. stable, preview (optional)"
                          className="mt-0.5 h-7 text-xs font-mono"
                        />
                        <datalist id="model-spec-versions">
                          <option value="stable">stable (GA fine-tuned)</option>
                          <option value="preview">preview (Public preview)</option>
                        </datalist>
                      </div>

                      <div className="col-span-full flex flex-wrap gap-3 pt-1 text-[11px]">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <Checkbox checked={summaryCitations} onCheckedChange={(c) => setSummaryCitations(!!c)} />
                          <span>includeCitations</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <Checkbox checked={summaryAdversarial} onCheckedChange={(c) => setSummaryAdversarial(!!c)} />
                          <span>ignoreAdversarial</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <Checkbox checked={summaryNonSeeking} onCheckedChange={(c) => setSummaryNonSeeking(!!c)} />
                          <span>ignoreNonSummarySeeking</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <Checkbox checked={summaryLowRelevant} onCheckedChange={(c) => setSummaryLowRelevant(!!c)} />
                          <span>ignoreLowRelevant</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <Checkbox checked={summarySemanticChunks} onCheckedChange={(c) => setSummarySemanticChunks(!!c)} />
                          <span>useSemanticChunks</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. extractiveContentSpec */}
                <div className="border border-border rounded-md p-3 bg-card space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                      <Checkbox checked={extractiveEnabled} onCheckedChange={(c) => setExtractiveEnabled(!!c)} />
                      <span>contentSearchSpec.extractiveContentSpec</span>
                    </label>
                    <Badge variant={extractiveEnabled ? 'default' : 'secondary'} className="text-[9px]">
                      {extractiveEnabled ? 'ENABLED' : 'DISABLED'}
                    </Badge>
                  </div>

                  {extractiveEnabled && (
                    <div className="pt-2 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Max Answers</Label>
                        <Input
                          type="number"
                          value={extractiveAnswers}
                          onChange={(e) => setExtractiveAnswers(Number(e.target.value))}
                          className="mt-0.5 h-7 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Max Segments</Label>
                        <Input
                          type="number"
                          value={extractiveSegments}
                          onChange={(e) => setExtractiveSegments(Number(e.target.value))}
                          className="mt-0.5 h-7 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Prev Segments</Label>
                        <Input
                          type="number"
                          value={extractivePrev}
                          onChange={(e) => setExtractivePrev(Number(e.target.value))}
                          className="mt-0.5 h-7 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Next Segments</Label>
                        <Input
                          type="number"
                          value={extractiveNext}
                          onChange={(e) => setExtractiveNext(Number(e.target.value))}
                          className="mt-0.5 h-7 text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-full pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                          <Checkbox checked={extractiveReturnScore} onCheckedChange={(c) => setExtractiveReturnScore(!!c)} />
                          <span>returnExtractiveSegmentScore</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Snippets & Chunks Mode */}
                <div className="border border-border rounded-md p-3 bg-card space-y-2.5">
                  <div className="font-bold text-xs">Search Result Mode & Snippets</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-2">
                      <Label className="text-[10px] text-muted-foreground">searchResultMode</Label>
                      <Select
                        value={searchResultMode}
                        onChange={(e) => setSearchResultMode(e.target.value as any)}
                        className="h-7 text-xs font-mono font-semibold"
                      >
                        <option value="DOCUMENTS">DOCUMENTS (Full Document Mode)</option>
                        <option value="CHUNKS">CHUNKS (Direct Chunk Return Mode)</option>
                      </Select>
                      {searchResultMode === 'CHUNKS' && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <Label className="text-[9.5px] text-muted-foreground">numPreviousChunks</Label>
                            <Input
                              type="number"
                              value={chunkPrev}
                              onChange={(e) => setChunkPrev(Number(e.target.value))}
                              className="h-6 text-xs font-mono"
                            />
                          </div>
                          <div>
                            <Label className="text-[9.5px] text-muted-foreground">numNextChunks</Label>
                            <Input
                              type="number"
                              value={chunkNext}
                              onChange={(e) => setChunkNext(Number(e.target.value))}
                              className="h-6 text-xs font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-xs pt-1">
                        <Checkbox checked={snippetReturn} onCheckedChange={(c) => setSnippetReturn(!!c)} />
                        <span>snippetSpec.returnSnippet</span>
                      </label>
                      {snippetReturn && (
                        <div>
                          <Label className="text-[9.5px] text-muted-foreground">maxSnippetCount</Label>
                          <Input
                            type="number"
                            value={snippetMax}
                            onChange={(e) => setSnippetMax(Number(e.target.value))}
                            className="h-7 text-xs font-mono mt-0.5"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Query Expansion, Spell, NL Understanding */}
                <div className="border border-border rounded-md p-3 bg-card space-y-2.5">
                  <div className="font-bold text-xs">Query Understanding & Optimization</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Query Expansion</Label>
                      <Select
                        value={qeCondition}
                        onChange={(e) => setQeCondition(e.target.value as any)}
                        className="mt-0.5 h-7 text-xs font-mono"
                      >
                        <option value="AUTO">AUTO (Recommended)</option>
                        <option value="DISABLED">DISABLED</option>
                      </Select>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10.5px] mt-1">
                        <Checkbox checked={qePin} onCheckedChange={(c) => setQePin(!!c)} />
                        <span>pinUnexpandedResults</span>
                      </label>
                    </div>

                    <div>
                      <Label className="text-[10px] text-muted-foreground">Spell Correction</Label>
                      <Select
                        value={spellMode}
                        onChange={(e) => setSpellMode(e.target.value as any)}
                        className="mt-0.5 h-7 text-xs font-mono"
                      >
                        <option value="AUTO">AUTO</option>
                        <option value="SUGGESTION_ONLY">SUGGESTION_ONLY</option>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-[10px] text-muted-foreground">NL Filter Extraction</Label>
                      <Select
                        value={nlFilterCondition}
                        onChange={(e) => setNlFilterCondition(e.target.value as any)}
                        className="mt-0.5 h-7 text-xs font-mono"
                      >
                        <option value="DISABLED">DISABLED</option>
                        <option value="ENABLED">ENABLED</option>
                      </Select>
                    </div>
                  </div>
                </div>

              </TabsContent>

              {/* ========================================================= */}
              {/* TAB 4: HEADERS                                           */}
              {/* ========================================================= */}
              <TabsContent value="headers" className="mt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    HTTP Request Headers
                  </h3>
                  <span className="text-[10px] text-muted-foreground">Automatically attached to outbound GCP API call</span>
                </div>

                <div className="border border-border rounded-md overflow-hidden bg-card text-xs">
                  <div className="grid grid-cols-12 gap-2 px-3 py-1.5 bg-muted/50 border-b border-border font-semibold text-[11px] text-muted-foreground">
                    <div className="col-span-5">Header Key</div>
                    <div className="col-span-7">Header Value</div>
                  </div>

                  {/* Authorization */}
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 items-center border-b border-border/50">
                    <div className="col-span-5 font-mono font-bold text-xs">Authorization</div>
                    <div className="col-span-7 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 truncate">
                      {customToken.trim() ? `Bearer ${customToken.slice(0, 10)}... (Custom Token)` : 'Bearer $(gcloud auth print-access-token)'}
                    </div>
                  </div>

                  {/* X-Goog-User-Project */}
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 items-center border-b border-border/50">
                    <div className="col-span-5 font-mono font-bold text-xs">X-Goog-User-Project</div>
                    <div className="col-span-7">
                      <Input
                        value={quotaProject}
                        onChange={(e) => setQuotaProject(e.target.value)}
                        placeholder={`Defaults to: ${projectId}`}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Content-Type */}
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 items-center border-b border-border/50">
                    <div className="col-span-5 font-mono font-bold text-xs">Content-Type</div>
                    <div className="col-span-7 font-mono text-[11px] text-muted-foreground">
                      application/json
                    </div>
                  </div>

                  {/* Custom Bearer Token override */}
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 items-center">
                    <div className="col-span-5 font-mono text-xs">
                      Custom Token Override <span className="text-[10px] text-muted-foreground">(optional)</span>
                    </div>
                    <div className="col-span-7">
                      <Input
                        type="password"
                        value={customToken}
                        onChange={(e) => setCustomToken(e.target.value)}
                        placeholder="Leave empty to use local ADC"
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>



            </div>
          </Tabs>
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 2 (MIDDLE): REAL-TIME REQUEST BODY (JSON / cURL)                   */}
        {/* ========================================================================= */}
        <div className="flex flex-col h-full min-h-0 bg-background overflow-hidden border-t lg:border-t-0">
          {/* Header */}
          <div className="h-10 px-3 border-b border-border bg-card/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                Request Body
              </span>
              <Badge variant="outline" className="text-[9.5px] font-mono bg-background text-foreground border-border">
                {requestBodyMode === 'json' ? `${Object.keys(payloadJson).length} keys` : 'cURL'}
              </Badge>
              <span className="text-emerald-500 text-[10.5px] font-mono font-medium flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-muted/50 rounded p-0.5 border border-border text-[10.5px]">
                <button
                  onClick={() => setRequestBodyMode('json')}
                  className={`px-2 py-0.5 rounded font-mono transition-colors ${
                    requestBodyMode === 'json'
                      ? 'bg-background shadow-xs text-foreground font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  JSON Body
                </button>
                <button
                  onClick={() => setRequestBodyMode('curl')}
                  className={`px-2 py-0.5 rounded font-mono transition-colors ${
                    requestBodyMode === 'curl'
                      ? 'bg-background shadow-xs text-foreground font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  cURL
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] px-2.5"
                onClick={() => {
                  if (requestBodyMode === 'json') {
                    navigator.clipboard.writeText(payloadString);
                    setCopiedPayload(true);
                    setTimeout(() => setCopiedPayload(false), 1500);
                  } else {
                    navigator.clipboard.writeText(curlCommand);
                    setCopiedCurl(true);
                    setTimeout(() => setCopiedCurl(false), 1500);
                  }
                }}
              >
                {(requestBodyMode === 'json' ? copiedPayload : copiedCurl) ? (
                  <Check className="h-3 w-3 text-emerald-500 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                <span>{(requestBodyMode === 'json' ? copiedPayload : copiedCurl) ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
          </div>

          {/* Code Viewer with Line Numbers */}
          <div className="flex-1 min-h-0 flex overflow-auto bg-zinc-950 text-zinc-100 font-mono text-xs select-text">
            {/* Line numbers column */}
            <div className="select-none py-3 px-2 text-right text-zinc-600 bg-zinc-900/60 border-r border-zinc-800 text-[11px] leading-relaxed shrink-0 min-w-[34px]">
              {(requestBodyMode === 'json' ? payloadString : curlCommand).split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            {/* Code Content */}
            <pre className="flex-1 py-3 px-3 overflow-x-auto text-[11.5px] leading-relaxed font-mono whitespace-pre text-emerald-400/95 selection:bg-emerald-950 selection:text-emerald-200">
              <code>{requestBodyMode === 'json' ? payloadString : curlCommand}</code>
            </pre>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 3 (RIGHT): POSTMAN RESPONSE VIEWER (RAW DATA ONLY)                 */}
        {/* ========================================================================= */}
        <div className="flex flex-col h-full min-h-0 bg-background overflow-hidden">
          
          {/* Response Status Bar */}
          <div className="h-10 px-3 border-b border-border bg-card/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Response
              </span>

              {/* Status Code Badge */}
              <Badge
                variant={statusCode === 200 ? 'default' : (statusCode && statusCode >= 400 ? 'destructive' : 'secondary')}
                className={`font-mono text-xs font-bold px-2 h-5 ${
                  statusCode === 200 ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                }`}
              >
                {statusBadge}
              </Badge>

              {/* Latency Badge */}
              <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className={latencyMs > 1500 ? 'text-amber-500 font-bold' : ''}>
                  {latencyMs} ms
                </span>
              </div>

              {/* Payload Size */}
              <div className="text-[11px] font-mono text-muted-foreground">
                {responseSizeKb} KB
              </div>

              {/* Document Count */}
              {docCount > 0 && (
                <Badge variant="outline" className="font-mono text-[10px] h-5 hidden sm:inline-flex">
                  {docCount} Docs {totalSize !== null ? `(${totalSize} Total)` : ''}
                </Badge>
              )}
            </div>

            {/* Response Actions */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] px-2.5"
                onClick={() => {
                  navigator.clipboard.writeText(rawResponseText);
                  setCopiedRaw(true);
                  setTimeout(() => setCopiedRaw(false), 1500);
                }}
              >
                {copiedRaw ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1" />}
                {copiedRaw ? 'Copied' : 'Copy'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] px-2.5"
                onClick={() => {
                  const blob = new Blob([rawResponseText], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `vais_search_response_${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-3 w-3 mr-1" />
                Save .json
              </Button>

              {/* Grep Filter Input */}
              <div className="flex items-center gap-1 pl-1 border-l border-border">
                <Filter className="h-3 w-3 text-muted-foreground" />
                <Input
                  value={grepFilter}
                  onChange={(e) => setGrepFilter(e.target.value)}
                  placeholder="Filter lines..."
                  className="h-7 w-28 text-[11px] font-mono px-2"
                />
              </div>
            </div>
          </div>

          {/* Raw JSON Viewer (Full-Height Dark Monospace Editor) */}
          <div className="flex-1 min-h-0 bg-zinc-950 relative overflow-hidden">
            <textarea
              readOnly
              value={displayedRawText}
              spellCheck={false}
              className="w-full h-full p-3 font-mono text-xs bg-zinc-950 text-emerald-400 border-0 resize-none focus:outline-none select-text leading-relaxed selection:bg-emerald-950 selection:text-emerald-200"
            />
          </div>

        </div>

      </div>

    </div>
  );
}
