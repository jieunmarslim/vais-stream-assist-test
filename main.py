import json
import time
import uuid
import os
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import google.auth
from google.auth.transport.requests import Request as GoogleAuthRequest
import requests

app = FastAPI(title="Gemini Enterprise / Vertex AI Search Tester", version="1.0.0")

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # Basic CSP allowing inline styles and CDN scripts for icons and UI
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com; "
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; "
        "img-src 'self' data: https:; "
        "connect-src 'self';"
    )
    return response

# Pydantic Request Models
class SummarySpecModel(BaseModel):
    enabled: bool = True
    summary_result_count: int = Field(default=3, ge=1, le=10)
    include_citations: bool = True
    generate_pruned_summary: bool = False
    ignore_adversarial_query: bool = True
    ignore_non_summary_seeking_query: bool = True
    ignore_low_relevant_content: bool = True
    language_code: Optional[str] = "ko"
    model_version: Optional[str] = "gemini-1.5-flash-002/default"
    model_prompt_preamble: Optional[str] = "답변은 신뢰할 수 있는 정보를 바탕으로 한국어로 공손하고 명확하게 요약해 주세요."
    use_semantic_chunks: bool = False

class ExtractiveContentSpecModel(BaseModel):
    enabled: bool = True
    max_extractive_answer_count: int = Field(default=1, ge=0, le=5)
    max_extractive_segment_count: int = Field(default=1, ge=0, le=5)
    return_extractive_segment_score: bool = True
    num_previous_segments: int = Field(default=0, ge=0, le=3)
    num_next_segments: int = Field(default=0, ge=0, le=3)

class SnippetSpecModel(BaseModel):
    return_snippet: bool = True
    max_snippet_count: int = Field(default=2, ge=1, le=5)

class ChunkSpecModel(BaseModel):
    num_previous_chunks: int = Field(default=0, ge=0, le=3)
    num_next_chunks: int = Field(default=0, ge=0, le=3)

class QueryExpansionSpecModel(BaseModel):
    condition: str = "AUTO"  # AUTO or DISABLED
    pin_unexpanded_results: bool = False

class SpellCorrectionSpecModel(BaseModel):
    mode: str = "AUTO"  # AUTO or SUGGESTION_ONLY

class NaturalLanguageQueryUnderstandingSpecModel(BaseModel):
    filter_extraction_condition: str = "DISABLED"  # ENABLED or DISABLED
    geo_search_condition: str = "DISABLED"

class BoostConditionModel(BaseModel):
    condition: str
    boost: float = Field(default=0.0, ge=-1.0, le=1.0)

class SearchConfig(BaseModel):
    # Target GCP Resource
    project_id: str
    location: str = "global"
    collection_id: str = "default_collection"
    resource_type: str = "dataStores"  # dataStores or engines
    resource_id: str
    serving_config_id: str = "default_search"
    api_version: str = "v1alpha"  # v1, v1beta, v1alpha

    # Execution Mode & Auth
    mode: str = "mock"  # "mock" or "live"
    custom_token: Optional[str] = None
    quota_project: Optional[str] = None

    # Query & Pagination
    query: str
    page_size: int = Field(default=10, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
    page_token: Optional[str] = None
    filter: Optional[str] = None
    order_by: Optional[str] = None
    user_pseudo_id: Optional[str] = None

    # Specs
    summary_spec: SummarySpecModel = Field(default_factory=SummarySpecModel)
    extractive_spec: ExtractiveContentSpecModel = Field(default_factory=ExtractiveContentSpecModel)
    snippet_spec: SnippetSpecModel = Field(default_factory=SnippetSpecModel)
    search_result_mode: str = "DOCUMENTS"  # DOCUMENTS or CHUNKS
    chunk_spec: ChunkSpecModel = Field(default_factory=ChunkSpecModel)

    query_expansion_spec: QueryExpansionSpecModel = Field(default_factory=QueryExpansionSpecModel)
    spell_correction_spec: SpellCorrectionSpecModel = Field(default_factory=SpellCorrectionSpecModel)
    nl_understanding_spec: NaturalLanguageQueryUnderstandingSpecModel = Field(
        default_factory=NaturalLanguageQueryUnderstandingSpecModel
    )

    boost_specs: List[BoostConditionModel] = Field(default_factory=list)
    facet_specs: List[str] = Field(default_factory=list)


def build_discovery_engine_payload(cfg: SearchConfig) -> Dict[str, Any]:
    """Constructs the exact JSON request body expected by Vertex AI Search API."""
    payload: Dict[str, Any] = {
        "query": cfg.query,
        "pageSize": cfg.page_size,
    }

    if cfg.offset > 0:
        payload["offset"] = cfg.offset

    if cfg.page_token and cfg.page_token.strip():
        payload["pageToken"] = cfg.page_token.strip()

    if cfg.filter and cfg.filter.strip():
        payload["filter"] = cfg.filter.strip()

    if cfg.order_by and cfg.order_by.strip():
        payload["orderBy"] = cfg.order_by.strip()

    if cfg.user_pseudo_id and cfg.user_pseudo_id.strip():
        payload["userPseudoId"] = cfg.user_pseudo_id.strip()

    # Content Search Spec
    content_search_spec: Dict[str, Any] = {}

    # 1. Snippets
    if cfg.snippet_spec.return_snippet:
        content_search_spec["snippetSpec"] = {
            "returnSnippet": True,
            "maxSnippetCount": cfg.snippet_spec.max_snippet_count
        }

    # 2. Extractive Content
    if cfg.extractive_spec.enabled:
        extractive_spec: Dict[str, Any] = {
            "maxExtractiveAnswerCount": cfg.extractive_spec.max_extractive_answer_count,
            "maxExtractiveSegmentCount": cfg.extractive_spec.max_extractive_segment_count,
            "returnExtractiveSegmentScore": cfg.extractive_spec.return_extractive_segment_score
        }
        if cfg.extractive_spec.num_previous_segments > 0:
            extractive_spec["numPreviousSegments"] = cfg.extractive_spec.num_previous_segments
        if cfg.extractive_spec.num_next_segments > 0:
            extractive_spec["numNextSegments"] = cfg.extractive_spec.num_next_segments
        content_search_spec["extractiveContentSpec"] = extractive_spec

    # 3. Summary Spec (Gemini Grounded Summarization)
    if cfg.summary_spec.enabled:
        summary_dict: Dict[str, Any] = {
            "summaryResultCount": cfg.summary_spec.summary_result_count,
            "includeCitations": cfg.summary_spec.include_citations,
            "generatePrunedSummary": cfg.summary_spec.generate_pruned_summary,
            "ignoreAdversarialQuery": cfg.summary_spec.ignore_adversarial_query,
            "ignoreNonSummarySeekingQuery": cfg.summary_spec.ignore_non_summary_seeking_query,
            "ignoreLowRelevantContent": cfg.summary_spec.ignore_low_relevant_content,
            "useSemanticChunks": cfg.summary_spec.use_semantic_chunks
        }
        if cfg.summary_spec.language_code and cfg.summary_spec.language_code.strip():
            summary_dict["languageCode"] = cfg.summary_spec.language_code.strip()
        if cfg.summary_spec.model_version and cfg.summary_spec.model_version.strip():
            summary_dict["modelSpec"] = {"version": cfg.summary_spec.model_version.strip()}
        if cfg.summary_spec.model_prompt_preamble and cfg.summary_spec.model_prompt_preamble.strip():
            summary_dict["modelPromptSpec"] = {"preamble": cfg.summary_spec.model_prompt_preamble.strip()}

        content_search_spec["summarySpec"] = summary_dict

    # 4. Search Result Mode & Chunk Spec
    if cfg.search_result_mode in ("DOCUMENTS", "CHUNKS"):
        content_search_spec["searchResultMode"] = cfg.search_result_mode

    if cfg.search_result_mode == "CHUNKS" and (cfg.chunk_spec.num_previous_chunks > 0 or cfg.chunk_spec.num_next_chunks > 0):
        content_search_spec["chunkSpec"] = {
            "numPreviousChunks": cfg.chunk_spec.num_previous_chunks,
            "numNextChunks": cfg.chunk_spec.num_next_chunks
        }

    if content_search_spec:
        payload["contentSearchSpec"] = content_search_spec

    # Query Expansion Spec
    if cfg.query_expansion_spec.condition:
        payload["queryExpansionSpec"] = {
            "condition": cfg.query_expansion_spec.condition,
            "pinUnexpandedResults": cfg.query_expansion_spec.pin_unexpanded_results
        }

    # Spell Correction Spec
    if cfg.spell_correction_spec.mode:
        payload["spellCorrectionSpec"] = {
            "mode": cfg.spell_correction_spec.mode
        }

    # Natural Language Understanding Spec
    nl_spec: Dict[str, Any] = {}
    if cfg.nl_understanding_spec.filter_extraction_condition != "DISABLED":
        nl_spec["filterExtractionCondition"] = cfg.nl_understanding_spec.filter_extraction_condition
    if cfg.nl_understanding_spec.geo_search_condition != "DISABLED":
        nl_spec["geoSearchCondition"] = cfg.nl_understanding_spec.geo_search_condition
    if nl_spec:
        payload["naturalLanguageQueryUnderstandingSpec"] = nl_spec

    # Boost Spec
    if cfg.boost_specs:
        condition_boost_specs = []
        for b in cfg.boost_specs:
            if b.condition.strip():
                condition_boost_specs.append({
                    "condition": b.condition.strip(),
                    "boost": b.boost
                })
        if condition_boost_specs:
            payload["boostSpec"] = {"conditionBoostSpecs": condition_boost_specs}

    # Facet Specs
    if cfg.facet_specs:
        facets = []
        for key in cfg.facet_specs:
            if key.strip():
                facets.append({"facetKey": {"key": key.strip()}})
        if facets:
            payload["facetSpecs"] = facets

    return payload


def generate_mock_search_response(cfg: SearchConfig, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Generates an authentic mock Vertex AI Search response with citations, extractive answers, and facets."""
    query = cfg.query or "테스트 검색어"
    doc_count = min(cfg.page_size, 5)

    mock_docs = [
        {
            "id": "doc-cloud-arch-2024",
            "title": "Google Cloud 및 Gemini Enterprise 아키텍처 가이드라인",
            "uri": "gs://enterprise-knowledge-base/docs/architecture_guidelines_2024.pdf",
            "snippet": f"<b>{query}</b> 관련 엔터프라이즈 환경 구축 시 보안, IAM 접근 제어, 데이터 주권 규정 준수를 위한 기본 권장 사항을 다룹니다.",
            "extractive_answer": f"{query}을(를) 활용할 때 엔터프라이즈 라이선스는 고객 데이터가 모델 학습에 재사용되지 않으며 VPC-SC 및 CMEK 암호화를 완벽히 지원합니다.",
            "extractive_segment": f"Gemini Enterprise 검색 아키텍처는 Vertex AI Search (Discovery Engine) 인덱스를 기반으로 하며, 세분화된 ACL과 하이브리드 벡터 검색을 통해 실시간 색인 및 검색을 제공합니다.",
            "category": "Architecture",
            "author": "Cloud CoE",
            "lastUpdated": "2024-08-15"
        },
        {
            "id": "doc-security-policy-v3",
            "title": "사내 정보보호 정책 및 Gemini API 접근 제어 지침",
            "uri": "https://intranet.company.internal/security/gemini_policy_v3.html",
            "snippet": f"인증 및 인가: OAuth 2.0 및 Google Workspace 통합 계정 인증을 통해 <b>{query}</b> 접근 권한을 관리하며, 감사 로그(Cloud Audit Logs)를 기본 수집합니다.",
            "extractive_answer": "모든 검색 쿼리 및 검색 결과 문서는 사내 SSO 계정의 IAM 역할 및 보안 태그 기반으로 필터링되어 열람 권한이 없는 문서는 검색 결과에서 자동 제외됩니다.",
            "extractive_segment": "보안 규정 제14조에 따라 민감 데이터(PII)는 Data Loss Prevention(Sensitive Data Protection) API와 연계하여 마스킹 처리 후 저장 및 조회됩니다.",
            "category": "Security",
            "author": "보안운영팀",
            "lastUpdated": "2024-07-22"
        },
        {
            "id": "doc-onboarding-faq",
            "title": "임직원 업무 편의를 위한 생성형 AI 검색 포털 FAQ",
            "uri": "https://wiki.corp.internal/ai/search_portal_faq.md",
            "snippet": f"자주 묻는 질문: 사내 규정, 복지, HR, 기술 문서 등 다양한 저장소의 데이터를 하나의 통합 검색창에서 질의할 수 있습니다.",
            "extractive_answer": "검색창에 자연어로 질문하면 Gemini 모델이 상위 검색 결과 문서를 참조하여 출처 각주와 함께 신뢰할 수 있는 요약 답변을 제공합니다.",
            "extractive_segment": "기존 키워드 매칭 검색과 달리 문맥(Context)을 이해하는 임베딩 기반 시맨틱 검색을 병행하여 오타나 유사 표현에도 정확한 문서를 찾아냅니다.",
            "category": "HR/General",
            "author": "인사혁신팀",
            "lastUpdated": "2024-09-01"
        },
        {
            "id": "doc-api-integration-guide",
            "title": "Vertex AI Search REST API 및 SDK 연동 개발자 가이드",
            "uri": "https://developer.company.internal/apis/vais-search-spec.json",
            "snippet": f"REST 엔드포인트 `/servingConfigs/default_search:search` 규격: summarySpec, extractiveContentSpec, boostSpec 파라미터를 활용한 맞춤형 검색 UI 구현 예제.",
            "extractive_answer": "summaryResultCount를 3~5로 지정하고 includeCitations: true를 전달하면 요약문 내에 인용 출처(citation) 링크가 함께 반환됩니다.",
            "extractive_segment": "부스트 스펙(boostSpec)을 설정하면 특정 태그나 최신 문서에 가중치를 부여하여 검색 랭킹 점수를 실시간 조정할 수 있습니다.",
            "category": "Development",
            "author": "플랫폼개발팀",
            "lastUpdated": "2024-08-30"
        },
        {
            "id": "doc-data-retention-2024",
            "title": "2024년 데이터 수명주기 및 버전 관리 표준",
            "uri": "gs://corp-legal-archive/compliance/retention_policy_2024.pdf",
            "snippet": f"데이터 백업 및 아카이빙 주기: <b>{query}</b> 관련 문서는 생성일로부터 3년간 보관 후 분기별 컴플라이언스 검토를 거칩니다.",
            "extractive_answer": "최신 버전 문서는 자동으로 색인에 반영되며 구버전 문서는 아카이브 태그가 부여되어 검색 랭킹에서 하향 조정됩니다.",
            "extractive_segment": "정기 데이터 검증 프로세스를 통해 중복 및 폐기된 문서는 검색 인덱스에서 주기적으로 삭제(Pruning) 처리됩니다.",
            "category": "Compliance",
            "author": "법무컴플라이언스팀",
            "lastUpdated": "2024-06-10"
        }
    ]

    results = []
    for i, doc in enumerate(mock_docs[:doc_count]):
        relevance_score = round(0.95 - (i * 0.08), 4)

        derived_data: Dict[str, Any] = {
            "title": doc["title"],
            "link": doc["uri"],
        }

        if cfg.snippet_spec.return_snippet:
            derived_data["snippets"] = [
                {"snippet": doc["snippet"], "snippet_status": "SUCCESS"}
            ]

        if cfg.extractive_spec.enabled:
            derived_data["extractive_answers"] = [
                {
                    "content": doc["extractive_answer"],
                    "pageNumber": "1"
                }
            ]
            derived_data["extractive_segments"] = [
                {
                    "content": doc["extractive_segment"],
                    "pageNumber": "1",
                    "relevanceScore": relevance_score
                }
            ]

        res_item: Dict[str, Any] = {
            "id": doc["id"],
            "document": {
                "name": f"projects/{cfg.project_id}/locations/{cfg.location}/collections/{cfg.collection_id}/{cfg.resource_type}/{cfg.resource_id}/documents/{doc['id']}",
                "id": doc["id"],
                "structData": {
                    "title": doc["title"],
                    "category": doc["category"],
                    "author": doc["author"],
                    "lastUpdated": doc["lastUpdated"],
                    "file_type": "pdf" if doc["uri"].endswith(".pdf") else "html"
                },
                "derivedStructData": derived_data
            }
        }
        results.append(res_item)

    response_payload: Dict[str, Any] = {
        "results": results,
        "totalSize": 42,
        "attributionToken": f"token-{uuid.uuid4().hex[:12]}",
        "nextPageToken": f"page-{uuid.uuid4().hex[:8]}" if cfg.page_size < 42 else None
    }

    # Add Summary if enabled
    if cfg.summary_spec.enabled:
        citations = []
        if cfg.summary_spec.include_citations:
            citations = [
                {
                    "startIndex": "0",
                    "endIndex": "118",
                    "sources": [{"referenceIndex": "0"}]
                },
                {
                    "startIndex": "120",
                    "endIndex": "245",
                    "sources": [{"referenceIndex": "1"}]
                },
                {
                    "startIndex": "247",
                    "endIndex": "380",
                    "sources": [{"referenceIndex": "2"}]
                }
            ]

        summary_text = (
            f"**질의 '{query}'에 대한 Gemini Grounded Summary 분석 결과입니다:**\n\n"
            f"1. **아키텍처 및 보안:** Gemini Enterprise 라이선스 환경에서는 엔터프라이즈 데이터가 모델 학습에 재사용되지 않으며, "
            f"사내 IAM 역할 및 VPC-SC 정책에 따라 접근이 엄격히 통제됩니다 [1].\n"
            f"2. **접근 제어 및 데이터 보호:** 모든 문서는 사용자 권한(ACL)을 기반으로 실시간 필터링되며, "
            f"민감 개인정보(PII)는 민감 데이터 보호 솔루션과 연동되어 안전하게 보호됩니다 [2].\n"
            f"3. **통합 검색 및 자연어 응답:** 키워드와 문맥 임베딩을 결합한 하이브리드 검색을 통해 다양한 사내 문서(PDF, HTML, Wiki)로부터 "
            f"직접적인 답변과 출처 인용 각주를 제공합니다 [3]."
        )

        response_payload["summary"] = {
            "summaryText": summary_text,
            "summarySkippedReasons": [],
            "safetyAttributes": {
                "categories": ["Hate Speech", "Harassment", "Dangerous Content", "Sexual"],
                "scores": [0.01, 0.02, 0.01, 0.0]
            }
        }
        if citations:
            response_payload["summary"]["summaryWithMetadata"] = {
                "summary": summary_text,
                "citationMetadata": {
                    "citations": citations
                },
                "references": [
                    {
                        "title": mock_docs[0]["title"],
                        "document": f"projects/{cfg.project_id}/.../documents/{mock_docs[0]['id']}",
                        "uri": mock_docs[0]["uri"]
                    },
                    {
                        "title": mock_docs[1]["title"],
                        "document": f"projects/{cfg.project_id}/.../documents/{mock_docs[1]['id']}",
                        "uri": mock_docs[1]["uri"]
                    },
                    {
                        "title": mock_docs[2]["title"],
                        "document": f"projects/{cfg.project_id}/.../documents/{mock_docs[2]['id']}",
                        "uri": mock_docs[2]["uri"]
                    }
                ]
            }

    # Add Query Expansion Info
    if cfg.query_expansion_spec.condition == "AUTO":
        response_payload["queryExpansionInfo"] = {
            "expandedQuery": True,
            "pinnedResultCount": 3 if cfg.query_expansion_spec.pin_unexpanded_results else 0
        }

    # Add Facet Results if requested
    if cfg.facet_specs:
        facets_data = []
        for key in cfg.facet_specs:
            if key == "category":
                values = [
                    {"value": "Architecture", "count": 14},
                    {"value": "Security", "count": 11},
                    {"value": "HR/General", "count": 9},
                    {"value": "Development", "count": 8}
                ]
            elif key == "author":
                values = [
                    {"value": "Cloud CoE", "count": 16},
                    {"value": "보안운영팀", "count": 12},
                    {"value": "플랫폼개발팀", "count": 8}
                ]
            else:
                values = [
                    {"value": "Default-Tag-1", "count": 7},
                    {"value": "Default-Tag-2", "count": 5}
                ]
            facets_data.append({"key": key, "values": values})
        response_payload["facets"] = facets_data

    return response_payload


def execute_live_search(cfg: SearchConfig, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Executes a real REST call to Google Cloud Discovery Engine Search API."""
    # Obtain Bearer token
    token = None
    if cfg.custom_token and cfg.custom_token.strip():
        token = cfg.custom_token.strip()
    else:
        try:
            credentials, default_project = google.auth.default(
                scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )
            credentials.refresh(GoogleAuthRequest())
            token = credentials.token
            if not cfg.project_id and default_project:
                cfg.project_id = default_project
        except Exception as e:
            return {
                "status_code": 401,
                "error": f"Google Cloud 인증 실패 (ADC): {str(e)}. 'Custom Bearer Token'을 직접 입력하거나 'Mock Mode'로 전환하세요.",
                "response": None,
                "latency_ms": 0
            }

    # Construct Discovery Engine REST endpoint
    # Format: https://discoveryengine.googleapis.com/{version}/projects/{project}/locations/{location}/collections/{collection}/{resourceType}/{resourceId}/servingConfigs/{servingConfig}:search
    url = (
        f"https://discoveryengine.googleapis.com/{cfg.api_version}/"
        f"projects/{cfg.project_id}/locations/{cfg.location}/"
        f"collections/{cfg.collection_id}/{cfg.resource_type}/{cfg.resource_id}/"
        f"servingConfigs/{cfg.serving_config_id}:search"
    )

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json; charset=utf-8"
    }

    # Add quota project if available
    quota_proj = cfg.quota_project or cfg.project_id
    if quota_proj:
        headers["X-Goog-User-Project"] = quota_proj

    start_time = time.time()
    try:
        res = requests.post(url, headers=headers, json=payload, timeout=30)
        latency_ms = int((time.time() - start_time) * 1000)

        try:
            res_json = res.json()
        except Exception:
            res_json = {"raw_text": res.text}

        return {
            "status_code": res.status_code,
            "endpoint_url": url,
            "response": res_json,
            "latency_ms": latency_ms,
            "error": None if res.status_code == 200 else res_json.get("error", {}).get("message", res.text)
        }
    except requests.exceptions.RequestException as req_err:
        latency_ms = int((time.time() - start_time) * 1000)
        return {
            "status_code": 500,
            "endpoint_url": url,
            "response": None,
            "latency_ms": latency_ms,
            "error": f"네트워크 통신 오류: {str(req_err)}"
        }


@app.get("/api/env-info")
def get_env_info():
    """Returns detected local GCP environment defaults safely (without exposing secrets)."""
    detected_project = os.environ.get("GOOGLE_CLOUD_PROJECT") or "gauravan-llm"
    has_adc = False
    try:
        creds, proj = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
        if proj:
            detected_project = proj
        has_adc = True
    except Exception:
        has_adc = False

    return {
        "default_project": detected_project,
        "default_location": "global",
        "default_collection": "default_collection",
        "default_serving_config": "default_search",
        "has_adc": has_adc
    }


@app.post("/api/search")
def search_endpoint(cfg: SearchConfig):
    """Main search endpoint supporting both Mock Mode and Live Discovery Engine API."""
    payload = build_discovery_engine_payload(cfg)

    # cURL generation for user inspection
    target_url = (
        f"https://discoveryengine.googleapis.com/{cfg.api_version}/"
        f"projects/{cfg.project_id or '$PROJECT_ID'}/locations/{cfg.location}/"
        f"collections/{cfg.collection_id}/{cfg.resource_type}/{cfg.resource_id or '$DATASTORE_ID'}/"
        f"servingConfigs/{cfg.serving_config_id}:search"
    )
    curl_command = (
        f"curl -X POST \\\n"
        f"  '{target_url}' \\\n"
        f"  -H 'Authorization: Bearer $(gcloud auth print-access-token)' \\\n"
        f"  -H 'X-Goog-User-Project: {cfg.quota_project or cfg.project_id or '$PROJECT_ID'}' \\\n"
        f"  -H 'Content-Type: application/json' \\\n"
        f"  -d '{json.dumps(payload, ensure_ascii=False, indent=2)}'"
    )

    if cfg.mode == "mock":
        time.sleep(0.12)  # subtle realistic latency
        raw_response = generate_mock_search_response(cfg, payload)
        return {
            "mode": "mock",
            "status_code": 200,
            "endpoint_url": target_url,
            "latency_ms": 124,
            "request_payload": payload,
            "curl_command": curl_command,
            "response": raw_response,
            "error": None
        }

    # Live Mode
    result = execute_live_search(cfg, payload)
    return {
        "mode": "live",
        "status_code": result["status_code"],
        "endpoint_url": result.get("endpoint_url", target_url),
        "latency_ms": result["latency_ms"],
        "request_payload": payload,
        "curl_command": curl_command,
        "response": result["response"],
        "error": result["error"]
    }


# Serve static frontend files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def serve_index():
    index_file = os.path.join("static", "index.html")
    if os.path.exists(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h1>Gemini Enterprise Search Test Tool</h1><p>static/index.html not found.</p>")


if __name__ == "__main__":
    import uvicorn
    # Enforce localhost/127.0.0.1 for security compliance
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
