import assert from 'node:assert/strict';
import { PayloadBuilder } from '../src/core/payload-builder.ts';
import type { IClientSearchConfig } from '../src/types/config.ts';

console.log('Running PayloadBuilder unit tests...');

// Test 1: Minimal Search Config
const minimalCfg: IClientSearchConfig = {
  project_id: 'test-project',
  resource_id: 'test-engine',
  query: 'Gemini Enterprise Test'
};
const p1 = PayloadBuilder.build(minimalCfg);
assert.equal(p1.query, 'Gemini Enterprise Test');
assert.equal(p1.pageSize, 10);
console.log('✔ Test 1: Minimal Search Config passed');

// Test 2: Gemini Grounded Summary & Extractive QA Specs
const fullCfg: IClientSearchConfig = {
  project_id: 'agentspace-test-469511',
  resource_id: 'gemini-enhanced-parser-tes_1775720801989',
  query: '보안 가이드라인',
  page_size: 25,
  filter: 'category: ANY("Security")',
  order_by: 'update_time desc',
  summary_spec: {
    enabled: true,
    summary_result_count: 5,
    include_citations: true,
    generate_pruned_summary: true,
    ignore_adversarial_query: true,
    ignore_non_summary_seeking_query: true,
    ignore_low_relevant_content: true,
    language_code: 'ko',
    model_version: 'gemini-1.5-flash-002/default',
    model_prompt_preamble: '한국어로 요약해주세요'
  },
  extractive_spec: {
    enabled: true,
    max_extractive_answer_count: 2,
    max_extractive_segment_count: 3,
    return_extractive_segment_score: true,
    num_previous_segments: 1,
    num_next_segments: 1
  },
  snippet_spec: {
    return_snippet: true,
    max_snippet_count: 3
  },
  search_result_mode: 'CHUNKS',
  chunk_spec: {
    num_previous_chunks: 2,
    num_next_chunks: 1
  },
  query_expansion_spec: {
    condition: 'AUTO',
    pin_unexpanded_results: true
  },
  spell_correction_spec: {
    mode: 'AUTO'
  },
  boost_specs: [
    { condition: 'category: ANY("Security")', boost: 0.8 }
  ],
  facet_specs: ['category', 'author']
};

const p2 = PayloadBuilder.build(fullCfg);
assert.equal(p2.query, '보안 가이드라인');
assert.equal(p2.pageSize, 25);
assert.equal(p2.filter, 'category: ANY("Security")');
assert.equal(p2.orderBy, 'update_time desc');

// Verify Content Search Spec
const cs = p2.contentSearchSpec!;
assert.equal(cs.summarySpec?.summaryResultCount, 5);
assert.equal(cs.summarySpec?.includeCitations, true);
assert.equal(cs.summarySpec?.modelSpec?.version, 'gemini-1.5-flash-002/default');
assert.equal(cs.extractiveContentSpec?.maxExtractiveAnswerCount, 2);
assert.equal(cs.extractiveContentSpec?.returnExtractiveSegmentScore, true);
assert.equal(cs.searchResultMode, 'CHUNKS');
assert.equal(cs.chunkSpec?.numPreviousChunks, 2);
assert.equal(cs.chunkSpec?.numNextChunks, 1);

// Verify Query Expansion & Boost & Facets
assert.equal(p2.queryExpansionSpec?.condition, 'AUTO');
assert.equal(p2.queryExpansionSpec?.pinUnexpandedResults, true);
assert.equal(p2.boostSpec?.conditionBoostSpecs[0].boost, 0.8);
assert.equal(p2.facetSpecs?.length, 2);
assert.equal(p2.facetSpecs?.[0].facetKey.key, 'category');

console.log('✔ Test 2: Full Spec Serialization passed');

// Test 3: cURL generation
const curlCmd = PayloadBuilder.buildCurlCommand(
  'https://discoveryengine.googleapis.com/v1alpha/projects/test/locations/global/...',
  'test-quota-proj',
  p2
);
assert.ok(curlCmd.includes('curl -X POST'));
assert.ok(curlCmd.includes('-H \'X-Goog-User-Project: test-quota-proj\''));
console.log('✔ Test 3: cURL Generation passed');

console.log('\nAll 3 unit test suites passed successfully! 🚀');
