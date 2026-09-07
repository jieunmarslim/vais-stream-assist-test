import pytest
from fastapi.testclient import TestClient
from main import app, build_discovery_engine_payload, SearchConfig

client = TestClient(app)

def test_homepage_serves_html():
    response = client.get("/")
    assert response.status_code == 200
    assert "Gemini Enterprise" in response.text
    assert "Search API Tester" in response.text
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"

def test_env_info_endpoint():
    response = client.get("/api/env-info")
    assert response.status_code == 200
    data = response.json()
    assert "default_project" in data
    assert "has_adc" in data

def test_mock_search_full_pipeline():
    payload = {
        "project_id": "test-project",
        "location": "global",
        "resource_type": "dataStores",
        "resource_id": "test-store",
        "serving_config_id": "default_search",
        "api_version": "v1alpha",
        "mode": "mock",
        "query": "Gemini Enterprise 보안 규정",
        "page_size": 5,
        "offset": 0,
        "summary_spec": {
            "enabled": True,
            "summary_result_count": 3,
            "include_citations": True,
            "generate_pruned_summary": False,
            "ignore_adversarial_query": True,
            "ignore_non_summary_seeking_query": True,
            "ignore_low_relevant_content": True,
            "language_code": "ko",
            "model_version": "gemini-1.5-flash-002/default",
            "model_prompt_preamble": "한국어로 친절하게 요약해주세요",
            "use_semantic_chunks": False
        },
        "extractive_spec": {
            "enabled": True,
            "max_extractive_answer_count": 1,
            "max_extractive_segment_count": 1,
            "return_extractive_segment_score": True,
            "num_previous_segments": 0,
            "num_next_segments": 0
        },
        "snippet_spec": {
            "return_snippet": True,
            "max_snippet_count": 2
        },
        "search_result_mode": "DOCUMENTS",
        "chunk_spec": {
            "num_previous_chunks": 0,
            "num_next_chunks": 0
        },
        "query_expansion_spec": {
            "condition": "AUTO",
            "pin_unexpanded_results": False
        },
        "spell_correction_spec": {
            "mode": "AUTO"
        },
        "nl_understanding_spec": {
            "filter_extraction_condition": "DISABLED",
            "geo_search_condition": "DISABLED"
        },
        "boost_specs": [
            {"condition": "category: ANY('Security')", "boost": 0.5}
        ],
        "facet_specs": ["category", "author"]
    }

    res = client.post("/api/search", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["mode"] == "mock"
    assert data["status_code"] == 200
    assert "curl_command" in data
    assert "request_payload" in data
    assert "response" in data

    raw_resp = data["response"]
    assert "summary" in raw_resp
    assert "summaryText" in raw_resp["summary"]
    assert "results" in raw_resp
    assert len(raw_resp["results"]) > 0
    assert "facets" in raw_resp
    assert any(f["key"] == "category" for f in raw_resp["facets"])

def test_payload_builder_chunks_and_specs():
    cfg = SearchConfig(
        project_id="my-proj",
        resource_id="my-store",
        query="인공지능 청크 검색",
        page_size=20,
        filter="department: 'AI'",
        order_by="score desc",
        search_result_mode="CHUNKS",
        chunk_spec={"num_previous_chunks": 2, "num_next_chunks": 1},
        facet_specs=["category"]
    )
    built = build_discovery_engine_payload(cfg)
    assert built["query"] == "인공지능 청크 검색"
    assert built["pageSize"] == 20
    assert built["filter"] == "department: 'AI'"
    assert built["orderBy"] == "score desc"
    assert built["contentSearchSpec"]["searchResultMode"] == "CHUNKS"
    assert built["contentSearchSpec"]["chunkSpec"]["numPreviousChunks"] == 2
    assert built["contentSearchSpec"]["chunkSpec"]["numNextChunks"] == 1
    assert built["facetSpecs"] == [{"facetKey": {"key": "category"}}]

if __name__ == "__main__":
    test_homepage_serves_html()
    test_env_info_endpoint()
    test_mock_search_full_pipeline()
    test_payload_builder_chunks_and_specs()
    print("All unit tests passed successfully!")
