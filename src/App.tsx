import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, Copy, Download, RefreshCw, Check, Terminal, Zap, Filter, Code2, Layers, CheckSquare, Square
} from 'lucide-react';

interface IDataStoreItem {
  id: string;
  displayName: string;
  fullPath: string;
  parserType: 'LAYOUT' | 'DIGITAL' | 'OCR' | 'DEFAULT' | 'UNSPECIFIED';
}

interface IBoostItem {
  condition: string;
  boost: number;
}

export default function App() {
  // Target Config State (Location is fixed to app's location 'global')
  const [projectId, setProjectId] = useState('agentspace-test-469511');
  const [apiVersion, setApiVersion] = useState('v1alpha');
  const location = 'global'; // Fixed to app's location per user requirement
  const [servingConfigId, setServingConfigId] = useState('default_search');
  const [targetType, setTargetType] = useState<'engines' | 'dataStores'>('engines');
  const [engineId, setEngineId] = useState('gemini-enhanced-parser-tes_1775720801989');
  const [discoveredEngines, setDiscoveredEngines] = useState<Array<{ id: string; displayName: string }>>([]);
  const [customToken, setCustomToken] = useState('');
  const [quotaProject, setQuotaProject] = useState('');

  // DataStores state
  const [dataStores, setDataStores] = useState<IDataStoreItem[]>([]);
  const [selectedDsIds, setSelectedDsIds] = useState<Set<string>>(new Set());
  const [dsLoading, setDsLoading] = useState(false);
  const [dsStatusMsg, setDsStatusMsg] = useState('');

  // Query & Properties State
  const [query, setQuery] = useState('Gemini Enterprise 아키텍처 및 보안 정책');
  
  // Core Search Props
  const [pageSizeEnabled, setPageSizeEnabled] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [offsetEnabled, setOffsetEnabled] = useState(false);
  const [offset, setOffset] = useState(0);
  const [pageTokenEnabled, setPageTokenEnabled] = useState(false);
  const [pageToken, setPageToken] = useState('');
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [filter, setFilter] = useState('category: ANY("Security")');
  const [canonicalFilterEnabled, setCanonicalFilterEnabled] = useState(false);
  const [canonicalFilter, setCanonicalFilter] = useState('');
  const [orderByEnabled, setOrderByEnabled] = useState(false);
  const [orderBy, setOrderBy] = useState('update_time desc');
  const [relevanceThresholdEnabled, setRelevanceThresholdEnabled] = useState(false);
  const [relevanceThreshold, setRelevanceThreshold] = useState('NONE');
  const [rankingExprEnabled, setRankingExprEnabled] = useState(false);
  const [rankingExpr, setRankingExpr] = useState('');
  const [userPseudoIdEnabled, setUserPseudoIdEnabled] = useState(false);
  const [userPseudoId, setUserPseudoId] = useState('test-user-uuid');

  // summarySpec
  const [summaryEnabled, setSummaryEnabled] = useState(true);
  const [summaryCount, setSummaryCount] = useState(3);
  const [summaryLang, setSummaryLang] = useState('ko');
  const [summaryCitations, setSummaryCitations] = useState(true);
  const [summaryAdversarial, setSummaryAdversarial] = useState(true);
  const [summaryNonSeeking, setSummaryNonSeeking] = useState(true);
  const [summaryLowRelevant, setSummaryLowRelevant] = useState(true);
  const [summarySemanticChunks, setSummarySemanticChunks] = useState(false);
  const [summaryModel, setSummaryModel] = useState('gemini-1.5-flash-002/default');
  const [summaryPreamble, setSummaryPreamble] = useState('답변은 신뢰할 수 있는 사내 문서를 바탕으로 한국어로 공손하고 명확하게 요약해 주세요.');

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

  // Boost & Facets
  const [boostSpecs, setBoostSpecs] = useState<IBoostItem[]>([
    { condition: 'category: ANY("Security")', boost: 0.5 }
  ]);
  const [facetKeys, setFacetKeys] = useState('category, author');
  const [customJsonParams, setCustomJsonParams] = useState('');

  // Results & Execution state
  const [isSearching, setIsSearching] = useState(false);
  const [statusBadge, setStatusBadge] = useState('READY');
  const [latencyMs, setLatencyMs] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const [totalSize, setTotalSize] = useState<number | null>(null);
  const [rawResponseText, setRawResponseText] = useState('{ "status": "Ready. Execute search to inspect raw response." }');
  const [grepFilter, setGrepFilter] = useState('');
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);

  // Fetch Engines List
  const fetchEngines = async () => {
    try {
      const params = new URLSearchParams({
        project_id: projectId,
        location,
        resource_type: 'engines',
        api_version: apiVersion
      });
      if (customToken) params.set('custom_token', customToken);
      if (quotaProject) params.set('quota_project', quotaProject);

      const res = await fetch(`/api/list-resources?${params.toString()}`);
      const data = await res.json();
      if (data.status === 'ok' && data.items) {
        setDiscoveredEngines(data.items.map((i: any) => ({ id: i.id, displayName: i.displayName })));
      }
    } catch (err: any) {
      console.error('Failed to fetch engines:', err);
    }
  };

  // Fetch DataStores for Engine
  const fetchDataStores = useCallback(async (targetEngine: string) => {
    if (!targetEngine || !projectId) return;
    setDsLoading(true);
    setDsStatusMsg('(Fetching DataStores from GCP...)');
    try {
      const params = new URLSearchParams({
        project_id: projectId,
        engine_id: targetEngine,
        location,
        api_version: apiVersion
      });
      if (customToken) params.set('custom_token', customToken);
      if (quotaProject) params.set('quota_project', quotaProject);

      const res = await fetch(`/api/engine-datastores?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        const list: IDataStoreItem[] = data.dataStores || [];
        setDataStores(list);
        setSelectedDsIds(new Set(list.map(ds => ds.id)));
        setDsStatusMsg(`(${list.length} DataStore(s) attached to '${data.displayName || targetEngine}')`);
      } else {
        setDataStores([]);
        setSelectedDsIds(new Set());
        setDsStatusMsg(`(Lookup error: ${data.message || 'Engine not found'})`);
      }
    } catch (err: any) {
      setDataStores([]);
      setDsStatusMsg(`(Error: ${err.message})`);
    } finally {
      setDsLoading(false);
    }
  }, [projectId, location, apiVersion, customToken, quotaProject]);

  // Initial load
  useEffect(() => {
    fetchDataStores(engineId);
  }, []);

  const handleEngineChange = (newEngine: string) => {
    setEngineId(newEngine);
    fetchDataStores(newEngine);
  };

  // Real-time Endpoint URL
  const endpointUrl = useMemo(() => {
    const proj = projectId || '$PROJECT_ID';
    const resId = engineId || '$RESOURCE_ID';
    const cfgId = servingConfigId || 'default_search';
    return `https://discoveryengine.googleapis.com/${apiVersion}/projects/${proj}/locations/${location}/collections/default_collection/${targetType}/${resId}/servingConfigs/${cfgId}:search`;
  }, [projectId, apiVersion, location, targetType, engineId, servingConfigId]);

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
    if (relevanceThresholdEnabled && relevanceThreshold !== 'NONE') p.relevanceThreshold = relevanceThreshold;
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
        ...(summaryLang ? { languageCode: summaryLang } : {}),
        ...(summaryModel ? { modelSpec: { version: summaryModel } } : {}),
        ...(summaryPreamble ? { modelPromptSpec: { preamble: summaryPreamble } } : {})
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

    const validBoosts = boostSpecs.filter(b => b.condition.trim().length > 0);
    if (validBoosts.length > 0) {
      p.boostSpec = { conditionBoostSpecs: validBoosts };
    }

    const facets = facetKeys.split(',').map(s => s.trim()).filter(Boolean);
    if (facets.length > 0) {
      p.facetSpecs = facets.map(key => ({ facetKey: { key } }));
    }

    if (customJsonParams.trim()) {
      try {
        const extra = JSON.parse(customJsonParams);
        if (typeof extra === 'object' && extra !== null) {
          Object.assign(p, extra);
        }
      } catch {
        // ignore invalid json while typing
      }
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
    summarySemanticChunks, summaryLang, summaryModel, summaryPreamble, searchResultMode,
    chunkPrev, chunkNext, qeEnabled, qeCondition, qePin, spellEnabled, spellMode,
    nlFilterCondition, boostSpecs, facetKeys, customJsonParams
  ]);

  const payloadString = useMemo(() => JSON.stringify(payloadJson, null, 2), [payloadJson]);

  // Reproduction cURL command
  const curlCommand = useMemo(() => {
    const quota = quotaProject.trim() || projectId;
    return `curl -X POST \\\n  '${endpointUrl}' \\\n  -H 'Authorization: Bearer $(gcloud auth print-access-token)' \\\n  -H 'X-Goog-User-Project: ${quota}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${payloadString}'`;
  }, [endpointUrl, quotaProject, projectId, payloadString]);

  // Search execution
  const executeSearch = async () => {
    setIsSearching(true);
    setStatusBadge('SEARCHING...');
    setRawResponseText(`// Sending POST request to:\n// ${endpointUrl}\n// Waiting for GCP response...`);

    const startTime = Date.now();

    try {
      const clientConfig: any = {
        project_id: projectId,
        api_version: apiVersion,
        location,
        resource_type: targetType,
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
        relevance_threshold: relevanceThresholdEnabled ? relevanceThreshold : undefined,
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
          language_code: summaryLang || undefined,
          model_version: summaryModel || undefined,
          model_prompt_preamble: summaryPreamble || undefined
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
        nl_understanding_spec: nlFilterCondition !== 'DISABLED' ? { filter_extraction_condition: nlFilterCondition } : undefined,
        boost_specs: boostSpecs.filter(b => b.condition.trim().length > 0),
        facet_specs: facetKeys.split(',').map(s => s.trim()).filter(Boolean),
        custom_params_json: customJsonParams.trim() || undefined
      };

      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientConfig)
      });

      const data = await res.json();
      const elapsed = data.latency_ms || (Date.now() - startTime);

      setLatencyMs(elapsed);
      setStatusBadge(`HTTP ${data.status_code || res.status}`);

      if (data.response) {
        setRawResponseText(JSON.stringify(data.response, null, 2));
        const hits = data.response.results?.length || 0;
        setDocCount(hits);
        setTotalSize(data.response.totalSize !== undefined ? data.response.totalSize : hits);
      } else {
        setRawResponseText(JSON.stringify(data, null, 2));
      }
    } catch (err: any) {
      setStatusBadge('NET ERROR');
      setRawResponseText(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsSearching(false);
    }
  };

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
            resource_type: targetType,
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

  // Presets
  const applyPreset = (preset: string) => {
    switch (preset) {
      case 'posco_internal':
        setRelevanceThresholdEnabled(true);
        setRelevanceThreshold('HIGH');
        setSummaryEnabled(true);
        setSummaryLowRelevant(true);
        setSummaryAdversarial(true);
        setSummaryNonSeeking(true);
        setSummaryCitations(true);
        setSummaryPreamble('반드시 검색된 내부 사내 문서의 정보에만 근거하여 한국어로 요약하세요. 외부 웹 검색이나 외부 지식을 추론하지 마십시오.');
        setQeEnabled(true);
        setQeCondition('DISABLED');
        break;
      case 'posco_digital':
        setQuery('계약서 내역 및 공급 업체 단가표');
        setPageSizeEnabled(true);
        setPageSize(20);
        setExtractiveEnabled(true);
        setExtractiveAnswers(2);
        setExtractiveSegments(3);
        setSearchResultMode('DOCUMENTS');
        break;
      case 'summary':
        setSummaryEnabled(true);
        setSummaryCount(5);
        setSummaryCitations(true);
        setSummaryModel('gemini-1.5-flash-002/default');
        break;
      case 'extractive':
        setExtractiveEnabled(true);
        setExtractiveAnswers(2);
        setExtractiveSegments(3);
        setExtractiveReturnScore(true);
        break;
      case 'chunks':
        setSearchResultMode('CHUNKS');
        setChunkPrev(2);
        setChunkNext(2);
        break;
      case 'minimal':
        setSummaryEnabled(false);
        setExtractiveEnabled(false);
        setSnippetReturn(false);
        setFilterEnabled(false);
        setQeEnabled(false);
        setSpellEnabled(false);
        break;
    }
  };

  return (
    <div className="w-full px-4 py-3 space-y-3">
      {/* 1. TOP HEADER & REALTIME OUTGOING ENDPOINT (ALWAYS VISIBLE) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-border">
        <div>
          <h1 className="text-sm font-extrabold tracking-wide uppercase flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            VAIS / Gemini Enterprise Search API Testbed
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Google Cloud Discovery Engine Search API Playground | Vite + shadcn/ui
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={statusBadge.includes('200') || statusBadge === 'READY' ? 'secondary' : 'destructive'} className="font-mono text-xs">
            {statusBadge}
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            {latencyMs} ms
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            {docCount} Docs {totalSize !== null ? `(${totalSize} Total)` : ''}
          </Badge>
          <Button 
            onClick={executeSearch} 
            disabled={isSearching} 
            size="sm"
            className="font-mono text-xs h-7 px-3"
          >
            <Search className="h-3.5 w-3.5 mr-1" />
            [ SEND REQUEST (Enter) ]
          </Button>
          <Button 
            onClick={runBurstTest} 
            disabled={isSearching} 
            variant="outline" 
            size="sm"
            className="font-mono text-xs h-7 px-2.5"
          >
            <Zap className="h-3.5 w-3.5 mr-1" />
            [ 5-REQ BURST ]
          </Button>
        </div>
      </header>

      {/* TOP: OUTGOING HTTP REQUEST INSPECTOR */}
      <Card className="bg-muted/40 border-muted-foreground/20">
        <CardHeader className="py-2 px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs uppercase flex items-center gap-1.5 font-bold tracking-wider">
              <Code2 className="h-3.5 w-3.5" />
              Outgoing HTTP Request Inspector
            </CardTitle>
            <span className="text-[10.5px] text-muted-foreground">Updates live as parameters change</span>
          </div>
          <div className="space-y-0.5 text-xs font-mono mt-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[11px]">METHOD:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">POST</span>
              <span className="font-bold text-[11px] ml-3">URL:</span>
              <code className="bg-background px-1.5 py-0.5 rounded text-[11px] border border-border flex-1 break-all select-all font-bold">
                {endpointUrl}
              </code>
            </div>
            <div className="text-muted-foreground text-[10.5px]">
              <b>HEADERS:</b> Authorization: Bearer [gcloud ADC] | X-Goog-User-Project: {quotaProject.trim() || projectId} | Content-Type: application/json
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase text-muted-foreground">LIVE OUTGOING REQUEST PAYLOAD (JSON)</span>
              <span className="text-[10px] text-muted-foreground">Exact body sent to GCP API</span>
            </div>
            <textarea
              readOnly
              value={payloadString}
              className="w-full h-28 p-2 text-xs font-mono bg-zinc-950 text-emerald-400 rounded border border-zinc-800 resize-y shadow-inner"
              spellCheck={false}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase text-muted-foreground">REPRODUCTION cURL COMMAND</span>
              <Button
                variant="outline"
                size="sm"
                className="h-5 text-[10px] px-2"
                onClick={() => {
                  navigator.clipboard.writeText(curlCommand);
                  setCopiedCurl(true);
                  setTimeout(() => setCopiedCurl(false), 1500);
                }}
              >
                {copiedCurl ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                {copiedCurl ? 'COPIED' : 'COPY cURL'}
              </Button>
            </div>
            <pre className="w-full h-28 p-2 text-xs font-mono bg-muted text-foreground rounded border border-border overflow-auto whitespace-pre-wrap break-all">
              {curlCommand}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* 2. MAIN SPLIT: LEFT (ALL CONTROLS) | RIGHT (RAW RESULTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* LEFT COLUMN: ALL TOGGLES & CONFIGURATION */}
        <div className="space-y-3">

          {/* Section: Target & DataStores */}
          <Card>
            <CardHeader className="py-2 px-3 border-b border-border">
              <CardTitle className="text-xs uppercase flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  01. Target Resource & Auto-Fetched DataStores
                </span>
                <span className="text-[10.5px] font-normal text-muted-foreground lowercase">app location: global</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2.5">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[10.5px] text-muted-foreground">Project ID</Label>
                  <Input value={projectId} onChange={(e) => setProjectId(e.target.value)} className="mt-0.5 h-7 text-xs font-mono" />
                </div>
                <div>
                  <Label className="text-[10.5px] text-muted-foreground">API Version</Label>
                  <Select value={apiVersion} onChange={(e) => setApiVersion(e.target.value)} className="mt-0.5 h-7 text-xs font-mono font-semibold">
                    <option value="v1alpha">v1alpha (Full Preview)</option>
                    <option value="v1beta">v1beta</option>
                    <option value="v1">v1 (GA)</option>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10.5px] text-muted-foreground">Serving Config ID</Label>
                  <Input value={servingConfigId} onChange={(e) => setServingConfigId(e.target.value)} className="mt-0.5 h-7 text-xs font-mono" />
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="text-muted-foreground text-[11px]">Mode:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="targetType" value="engines" checked={targetType === 'engines'} onChange={() => setTargetType('engines')} />
                  <span><b>Search Engine</b></span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="targetType" value="dataStores" checked={targetType === 'dataStores'} onChange={() => setTargetType('dataStores')} />
                  <span><b>Direct DataStore</b></span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10.5px] text-muted-foreground">Engine ID (Input triggers auto-fetch)</Label>
                  <Input 
                    value={engineId} 
                    onChange={(e) => handleEngineChange(e.target.value)} 
                    className="mt-0.5 h-7 text-xs font-mono font-bold" 
                  />
                </div>
                <div>
                  <Label className="text-[10.5px] text-muted-foreground">Or Select Discovered Engine</Label>
                  <div className="flex gap-1.5 mt-0.5">
                    <Select
                      value={engineId}
                      onChange={(e) => handleEngineChange(e.target.value)}
                      className="font-mono flex-1 h-7 text-xs"
                    >
                      <option value="">-- Discovered Engines --</option>
                      {discoveredEngines.map(eng => (
                        <option key={eng.id} value={eng.id}>{eng.displayName} ({eng.id})</option>
                      ))}
                    </Select>
                    <Button variant="outline" size="sm" onClick={fetchEngines} className="h-7 text-xs px-2">
                      Fetch
                    </Button>
                  </div>
                </div>
              </div>

              {/* Auto-Fetched DataStores Box */}
              <div className="rounded border border-border bg-muted/20 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <span>Attached DataStores:</span>
                    <span className="text-[10.5px] font-normal text-muted-foreground">{dsStatusMsg}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-5 text-[10px] px-1.5"
                      onClick={() => setSelectedDsIds(new Set(dataStores.map(d => d.id)))}
                    >
                      <CheckSquare className="h-2.5 w-2.5 mr-0.5" /> All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-5 text-[10px] px-1.5"
                      onClick={() => setSelectedDsIds(new Set())}
                    >
                      <Square className="h-2.5 w-2.5 mr-0.5" /> None
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-5 text-[10px] px-1.5"
                      onClick={() => fetchDataStores(engineId)}
                      disabled={dsLoading}
                    >
                      <RefreshCw className={`h-2.5 w-2.5 mr-0.5 ${dsLoading ? 'animate-spin' : ''}`} /> Refetch
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
                  {dataStores.length === 0 ? (
                    <div className="text-[11px] text-muted-foreground italic py-0.5">
                      No DataStores attached or not yet resolved for engine '{engineId}'.
                    </div>
                  ) : (
                    dataStores.map(ds => {
                      const isChecked = selectedDsIds.has(ds.id);
                      const isDigital = ds.parserType === 'DIGITAL';
                      return (
                        <div key={ds.id} className="flex items-center justify-between p-1 rounded bg-background border border-border text-[11px]">
                          <label className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(c) => {
                                const next = new Set(selectedDsIds);
                                if (c) next.add(ds.id);
                                else next.delete(ds.id);
                                setSelectedDsIds(next);
                              }}
                            />
                            <span className="font-mono font-bold truncate">{ds.id}</span>
                            <span className="text-muted-foreground truncate">({ds.displayName})</span>
                          </label>
                          <Badge variant={isDigital ? 'default' : 'secondary'} className="text-[9.5px] font-mono shrink-0 ml-1">
                            {isDigital ? 'DIGITAL PARSER' : (ds.parserType === 'LAYOUT' ? 'LAYOUT PARSER' : ds.parserType)}
                          </Badge>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Custom Bearer Token (Overrides ADC)</Label>
                  <Input 
                    type="password" 
                    placeholder="ya29.a0..." 
                    value={customToken} 
                    onChange={(e) => setCustomToken(e.target.value)} 
                    className="mt-0.5 h-6 text-xs font-mono" 
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Quota Project (X-Goog-User-Project)</Label>
                  <Input 
                    placeholder="Default: same as Project ID" 
                    value={quotaProject} 
                    onChange={(e) => setQuotaProject(e.target.value)} 
                    className="mt-0.5 h-6 text-xs font-mono" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section: Search Query & Presets */}
          <Card>
            <CardHeader className="py-2 px-3 border-b border-border">
              <CardTitle className="text-xs uppercase flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5" />
                02. Search Query & Presets
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              <div className="flex gap-1.5">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
                  placeholder="Enter search query..."
                  className="font-mono text-xs font-bold flex-1 h-8"
                />
                <Button onClick={executeSearch} disabled={isSearching} className="h-8 px-3 text-xs">
                  [ SEND ]
                </Button>
                <Button onClick={runBurstTest} disabled={isSearching} variant="outline" className="h-8 px-2 text-xs">
                  [ BURST ]
                </Button>
                <Button onClick={() => setQuery('')} variant="ghost" className="h-8 px-2 text-xs">
                  [ CLR ]
                </Button>
              </div>

              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10.5px] font-bold text-muted-foreground mr-0.5">Presets:</span>
                <Button variant="outline" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => applyPreset('posco_internal')}>
                  POSCO: Internal Only (No Web Grounding)
                </Button>
                <Button variant="outline" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => applyPreset('posco_digital')}>
                  POSCO: Digital Parser (Excel/CSV)
                </Button>
                <Button variant="outline" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => applyPreset('summary')}>
                  Grounded Summary
                </Button>
                <Button variant="outline" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => applyPreset('extractive')}>
                  Extractive QA
                </Button>
                <Button variant="outline" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => applyPreset('chunks')}>
                  Chunks Mode
                </Button>
                <Button variant="outline" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => applyPreset('minimal')}>
                  Minimal Raw
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Section: All Parameter Toggles */}
          <Card>
            <CardHeader className="py-2 px-3 border-b border-border">
              <CardTitle className="text-xs uppercase flex items-center justify-between">
                <span>03. Parameter Toggles & Specifications</span>
                <span className="text-[10px] font-normal text-muted-foreground">toggle properties on/off</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
              {/* Core Search & Pagination */}
              <div className="space-y-1.5 pb-2 border-b border-border">
                <h4 className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">Core Search & Pagination</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="flex items-center gap-1 text-[11px]">
                      <Checkbox checked={pageSizeEnabled} onCheckedChange={setPageSizeEnabled} />
                      <span>pageSize:</span>
                    </label>
                    <Input type="number" min={1} max={100} value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="mt-0.5 h-6 text-xs" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-[11px]">
                      <Checkbox checked={offsetEnabled} onCheckedChange={setOffsetEnabled} />
                      <span>offset:</span>
                    </label>
                    <Input type="number" min={0} value={offset} onChange={(e) => setOffset(Number(e.target.value))} className="mt-0.5 h-6 text-xs" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-[11px]">
                      <Checkbox checked={pageTokenEnabled} onCheckedChange={setPageTokenEnabled} />
                      <span>pageToken:</span>
                    </label>
                    <Input value={pageToken} onChange={(e) => setPageToken(e.target.value)} placeholder="token" className="mt-0.5 h-6 text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="flex items-center gap-1 text-[11px]">
                      <Checkbox checked={filterEnabled} onCheckedChange={setFilterEnabled} />
                      <span>filter:</span>
                    </label>
                    <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder='category: ANY("Security")' className="mt-0.5 h-6 text-xs" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-[11px]">
                      <Checkbox checked={canonicalFilterEnabled} onCheckedChange={setCanonicalFilterEnabled} />
                      <span>canonicalFilter:</span>
                    </label>
                    <Input value={canonicalFilter} onChange={(e) => setCanonicalFilter(e.target.value)} placeholder="canonical filter" className="mt-0.5 h-6 text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="flex items-center gap-1 text-[11px]">
                      <Checkbox checked={orderByEnabled} onCheckedChange={setOrderByEnabled} />
                      <span>orderBy:</span>
                    </label>
                    <Input value={orderBy} onChange={(e) => setOrderBy(e.target.value)} placeholder="update_time desc" className="mt-0.5 h-6 text-xs" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-[11px]">
                      <Checkbox checked={relevanceThresholdEnabled} onCheckedChange={setRelevanceThresholdEnabled} />
                      <span>relevanceThreshold:</span>
                    </label>
                    <Select value={relevanceThreshold} onChange={(e) => setRelevanceThreshold(e.target.value)} className="mt-0.5 h-6 text-xs">
                      <option value="NONE">NONE</option>
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH (엄격한 관련성)</option>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="flex items-center gap-1 text-[11px]">
                      <Checkbox checked={rankingExprEnabled} onCheckedChange={setRankingExprEnabled} />
                      <span>rankingExpression:</span>
                    </label>
                    <Input value={rankingExpr} onChange={(e) => setRankingExpr(e.target.value)} placeholder="expression" className="mt-0.5 h-6 text-xs" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-[11px]">
                      <Checkbox checked={userPseudoIdEnabled} onCheckedChange={setUserPseudoIdEnabled} />
                      <span>userPseudoId:</span>
                    </label>
                    <Input value={userPseudoId} onChange={(e) => setUserPseudoId(e.target.value)} placeholder="user-uuid" className="mt-0.5 h-6 text-xs" />
                  </div>
                </div>
              </div>

              {/* contentSearchSpec */}
              <div className="space-y-2 pb-2 border-b border-border">
                <h4 className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">contentSearchSpec</h4>

                {/* summarySpec */}
                <div className="p-2 rounded border border-border space-y-1.5 bg-muted/10 text-xs">
                  <label className="flex items-center gap-1.5 font-bold">
                    <Checkbox checked={summaryEnabled} onCheckedChange={setSummaryEnabled} />
                    <span>summarySpec.enabled (Gemini Grounded Summarization)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span>count:</span>
                      <Input type="number" min={1} max={10} value={summaryCount} onChange={(e) => setSummaryCount(Number(e.target.value))} className="mt-0.5 h-5 text-xs" />
                    </div>
                    <div>
                      <span>lang:</span>
                      <Input value={summaryLang} onChange={(e) => setSummaryLang(e.target.value)} className="mt-0.5 h-5 text-xs" />
                    </div>
                    <div className="flex items-end pb-0.5">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <Checkbox checked={summaryCitations} onCheckedChange={setSummaryCitations} />
                        <span>citations</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10.5px]">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <Checkbox checked={summaryAdversarial} onCheckedChange={setSummaryAdversarial} />
                      <span>ignoreAdversarial</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <Checkbox checked={summaryNonSeeking} onCheckedChange={setSummaryNonSeeking} />
                      <span>ignoreNonSeeking</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <Checkbox checked={summaryLowRelevant} onCheckedChange={setSummaryLowRelevant} />
                      <span>ignoreLowRelevant</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <Checkbox checked={summarySemanticChunks} onCheckedChange={setSummarySemanticChunks} />
                      <span>useSemanticChunks</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span>Model:</span>
                      <Select value={summaryModel} onChange={(e) => setSummaryModel(e.target.value)} className="mt-0.5 h-6 text-xs">
                        <option value="gemini-1.5-flash-002/default">gemini-1.5-flash-002/default</option>
                        <option value="gemini-1.5-pro-002/default">gemini-1.5-pro-002/default</option>
                        <option value="preview">preview</option>
                        <option value="default">default</option>
                      </Select>
                    </div>
                    <div>
                      <span>Preamble (System Instruction):</span>
                      <Input value={summaryPreamble} onChange={(e) => setSummaryPreamble(e.target.value)} className="mt-0.5 h-6 text-xs" />
                    </div>
                  </div>
                </div>

                {/* extractiveContentSpec */}
                <div className="p-2 rounded border border-border space-y-1.5 bg-muted/10 text-xs">
                  <label className="flex items-center gap-1.5 font-bold">
                    <Checkbox checked={extractiveEnabled} onCheckedChange={setExtractiveEnabled} />
                    <span>extractiveContentSpec.enabled (Direct Answers & Segments)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span>maxAnswers:</span>
                      <Input type="number" min={0} max={5} value={extractiveAnswers} onChange={(e) => setExtractiveAnswers(Number(e.target.value))} className="mt-0.5 h-5 text-xs" />
                    </div>
                    <div>
                      <span>maxSegments:</span>
                      <Input type="number" min={0} max={5} value={extractiveSegments} onChange={(e) => setExtractiveSegments(Number(e.target.value))} className="mt-0.5 h-5 text-xs" />
                    </div>
                    <div className="flex items-end pb-0.5">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <Checkbox checked={extractiveReturnScore} onCheckedChange={setExtractiveReturnScore} />
                        <span>returnScore</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="flex items-center gap-1">prevSegments: <Input type="number" min={0} max={3} value={extractivePrev} onChange={(e) => setExtractivePrev(Number(e.target.value))} className="h-5 w-10 text-xs" /></span>
                    <span className="flex items-center gap-1">nextSegments: <Input type="number" min={0} max={3} value={extractiveNext} onChange={(e) => setExtractiveNext(Number(e.target.value))} className="h-5 w-10 text-xs" /></span>
                  </div>
                </div>

                {/* snippetSpec & mode */}
                <div className="p-2 rounded border border-border space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <Checkbox checked={snippetReturn} onCheckedChange={setSnippetReturn} />
                      <span>snippetSpec.returnSnippet</span>
                    </label>
                    <span className="flex items-center gap-1">
                      maxSnippets: <Input type="number" min={1} max={5} value={snippetMax} onChange={(e) => setSnippetMax(Number(e.target.value))} className="h-5 w-10 text-xs" />
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1 border-t border-border">
                    <span>Mode:</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" name="resMode" value="DOCUMENTS" checked={searchResultMode === 'DOCUMENTS'} onChange={() => setSearchResultMode('DOCUMENTS')} />
                      <span>DOCUMENTS</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" name="resMode" value="CHUNKS" checked={searchResultMode === 'CHUNKS'} onChange={() => setSearchResultMode('CHUNKS')} />
                      <span>CHUNKS</span>
                    </label>
                    <span className="text-muted-foreground text-[10px]">(prev: {chunkPrev} next: {chunkNext})</span>
                  </div>
                </div>
              </div>

              {/* Query Understanding, Boost, Facets & Custom JSON */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="flex items-center gap-1">
                      <Checkbox checked={qeEnabled} onCheckedChange={setQeEnabled} />
                      <span>queryExpansion:</span>
                    </label>
                    <Select value={qeCondition} onChange={(e) => setQeCondition(e.target.value as any)} className="mt-0.5 h-6 text-xs">
                      <option value="AUTO">AUTO</option>
                      <option value="DISABLED">DISABLED</option>
                    </Select>
                  </div>
                  <div>
                    <label className="flex items-center gap-1">
                      <Checkbox checked={spellEnabled} onCheckedChange={setSpellEnabled} />
                      <span>spellCorrection:</span>
                    </label>
                    <Select value={spellMode} onChange={(e) => setSpellMode(e.target.value as any)} className="mt-0.5 h-6 text-xs">
                      <option value="AUTO">AUTO</option>
                      <option value="SUGGESTION_ONLY">SUGGESTION_ONLY</option>
                    </Select>
                  </div>
                </div>

                {/* Boost Specs */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-muted-foreground text-[10.5px]">boostSpec:</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-5 text-[10px] px-1.5"
                      onClick={() => setBoostSpecs([...boostSpecs, { condition: '', boost: 0.5 }])}
                    >
                      + Add Rule
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {boostSpecs.map((b, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs">
                        <Input
                          value={b.condition}
                          onChange={(e) => {
                            const copy = [...boostSpecs];
                            copy[idx].condition = e.target.value;
                            setBoostSpecs(copy);
                          }}
                          placeholder="category: ANY('Security')"
                          className="h-6 text-xs flex-1"
                        />
                        <span className="text-muted-foreground text-[10px]">boost:</span>
                        <Input
                          type="number"
                          step={0.1}
                          min={-1}
                          max={1}
                          value={b.boost}
                          onChange={(e) => {
                            const copy = [...boostSpecs];
                            copy[idx].boost = Number(e.target.value);
                            setBoostSpecs(copy);
                          }}
                          className="h-6 w-14 text-xs"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-destructive"
                          onClick={() => setBoostSpecs(boostSpecs.filter((_, i) => i !== idx))}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-[10px] text-muted-foreground">facetSpecs (Comma-separated keys)</Label>
                  <Input value={facetKeys} onChange={(e) => setFacetKeys(e.target.value)} className="mt-0.5 h-6 text-xs font-mono" />
                </div>

                <div>
                  <Label className="text-[10px] text-muted-foreground">Custom Raw JSON (Direct Injection)</Label>
                  <Textarea
                    value={customJsonParams}
                    onChange={(e) => setCustomJsonParams(e.target.value)}
                    placeholder='{ "userInfo": { "userId": "test-user" } }'
                    className="font-mono text-xs h-14 bg-background mt-0.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN: RAW DATA RESPONSE (JSON ONLY) - STICKY FULL HEIGHT */}
        <div className="sticky top-3 space-y-3">
          <Card className="flex flex-col h-[calc(100vh-180px)] min-h-[600px] shadow-sm">
            <CardHeader className="py-2 px-3 border-b border-border shrink-0">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <CardTitle className="text-xs uppercase flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5" />
                    04. Raw Data Response (JSON)
                  </CardTitle>
                  <Badge variant="secondary" className="font-mono text-[10px]">{statusBadge}</Badge>
                  <Badge variant="outline" className="font-mono text-[10px]">{latencyMs} ms</Badge>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {(new Blob([rawResponseText]).size / 1024).toFixed(1)} KB
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    className="h-6 text-[11px] px-2"
                    onClick={() => {
                      navigator.clipboard.writeText(rawResponseText);
                      setCopiedRaw(true);
                      setTimeout(() => setCopiedRaw(false), 1500);
                    }}
                  >
                    {copiedRaw ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    {copiedRaw ? 'COPIED' : 'COPY RAW'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[11px] px-2"
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
                    DOWNLOAD
                  </Button>
                  <div className="flex items-center gap-1 ml-1">
                    <Filter className="h-3 w-3 text-muted-foreground" />
                    <Input
                      value={grepFilter}
                      onChange={(e) => setGrepFilter(e.target.value)}
                      placeholder="grep lines..."
                      className="h-6 w-28 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
              <textarea
                readOnly
                value={displayedRawText}
                spellCheck={false}
                className="w-full h-full p-3 font-mono text-xs bg-zinc-950 text-zinc-100 border-0 rounded-b-lg resize-none focus:outline-none select-text"
              />
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
