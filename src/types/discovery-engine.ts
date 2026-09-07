/**
 * Strict TypeScript type definitions for Google Cloud Discovery Engine Search API.
 * Follows Discovery Engine v1alpha / v1 REST specifications.
 */

export interface ISnippetSpec {
  returnSnippet?: boolean;
  maxSnippetCount?: number;
}

export interface IExtractiveContentSpec {
  maxExtractiveAnswerCount?: number;
  maxExtractiveSegmentCount?: number;
  returnExtractiveSegmentScore?: boolean;
  numPreviousSegments?: number;
  numNextSegments?: number;
}

export interface IModelSpec {
  version?: string;
}

export interface IModelPromptSpec {
  preamble?: string;
}

export interface ISummarySpec {
  summaryResultCount?: number;
  includeCitations?: boolean;
  ignoreAdversarialQuery?: boolean;
  ignoreNonSummarySeekingQuery?: boolean;
  ignoreLowRelevantContent?: boolean;
  languageCode?: string;
  modelSpec?: IModelSpec;
  modelPromptSpec?: IModelPromptSpec;
  useSemanticChunks?: boolean;
}

export interface IChunkSpec {
  numPreviousChunks?: number;
  numNextChunks?: number;
}

export interface IContentSearchSpec {
  snippetSpec?: ISnippetSpec;
  extractiveContentSpec?: IExtractiveContentSpec;
  summarySpec?: ISummarySpec;
  searchResultMode?: 'DOCUMENTS' | 'CHUNKS';
  chunkSpec?: IChunkSpec;
}

export interface IQueryExpansionSpec {
  condition?: 'AUTO' | 'DISABLED';
  pinUnexpandedResults?: boolean;
}

export interface ISpellCorrectionSpec {
  mode?: 'AUTO' | 'SUGGESTION_ONLY';
}

export interface INaturalLanguageQueryUnderstandingSpec {
  filterExtractionCondition?: 'DISABLED' | 'ENABLED';
  geoSearchCondition?: 'DISABLED' | 'ENABLED';
}

export interface IConditionBoostSpec {
  condition: string;
  boost: number;
}

export interface IBoostSpec {
  conditionBoostSpecs: IConditionBoostSpec[];
}

export interface IFacetKey {
  key: string;
}

export interface IFacetSpec {
  facetKey: IFacetKey;
  limit?: number;
}

export interface IUserInfo {
  userId?: string;
  userAgent?: string;
}

export interface IDataStoreSpec {
  dataStore: string;
}

export interface ISearchRequestPayload {
  query: string;
  pageSize: number;
  offset?: number;
  pageToken?: string;
  filter?: string;
  canonicalFilter?: string;
  orderBy?: string;
  userInfo?: IUserInfo;
  userPseudoId?: string;
  relevanceThreshold?: 'RELEVANCE_THRESHOLD_UNSPECIFIED' | 'LOW' | 'MEDIUM' | 'HIGH';
  rankingExpression?: string;
  dataStoreSpecs?: IDataStoreSpec[];
  contentSearchSpec?: IContentSearchSpec;
  queryExpansionSpec?: IQueryExpansionSpec;
  spellCorrectionSpec?: ISpellCorrectionSpec;
  naturalLanguageQueryUnderstandingSpec?: INaturalLanguageQueryUnderstandingSpec;
  boostSpec?: IBoostSpec;
  facetSpecs?: IFacetSpec[];
  params?: Record<string, any>;
  [key: string]: any;
}

export interface ICitationSource {
  referenceIndex: string;
}

export interface ICitation {
  startIndex: string;
  endIndex: string;
  sources: ICitationSource[];
}

export interface ISummaryReference {
  title?: string;
  document?: string;
  uri?: string;
}

export interface ISummaryMetadata {
  citations?: ICitation[];
}

export interface ISummaryWithMetadata {
  summary?: string;
  citationMetadata?: ISummaryMetadata;
  references?: ISummaryReference[];
}

export interface ISummary {
  summaryText?: string;
  summarySkippedReasons?: string[];
  safetyAttributes?: {
    categories?: string[];
    scores?: number[];
  };
  summaryWithMetadata?: ISummaryWithMetadata;
}

export interface IExtractiveAnswer {
  content: string;
  pageNumber?: string;
}

export interface IExtractiveSegment {
  content: string;
  pageNumber?: string;
  relevanceScore?: number;
}

export interface ISnippet {
  snippet: string;
  snippet_status?: string;
}

export interface IDerivedStructData {
  title?: string;
  link?: string;
  snippets?: ISnippet[];
  extractive_answers?: IExtractiveAnswer[];
  extractive_segments?: IExtractiveSegment[];
}

export interface IDocument {
  name: string;
  id: string;
  structData?: Record<string, any>;
  derivedStructData?: IDerivedStructData;
}

export interface ISearchResult {
  id: string;
  document: IDocument;
}

export interface IFacetValue {
  value: string;
  count: number;
}

export interface IFacetResult {
  key: string;
  values: IFacetValue[];
}

export interface ISearchResponse {
  results?: ISearchResult[];
  totalSize?: number;
  attributionToken?: string;
  nextPageToken?: string;
  summary?: ISummary;
  facets?: IFacetResult[];
  queryExpansionInfo?: {
    expandedQuery?: boolean;
    pinnedResultCount?: number;
  };
  [key: string]: any;
}

export interface IDiscoveryEngineResource {
  id: string;
  displayName: string;
  solutionType?: string;
  dataStoreIds?: string[];
  parserType?: 'LAYOUT' | 'DIGITAL' | 'OCR' | 'DEFAULT' | 'UNSPECIFIED';
}
