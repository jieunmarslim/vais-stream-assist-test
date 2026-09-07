# Gemini Enterprise / Vertex AI Search Parameter Playground & Tester 🚀

Google Cloud **Gemini Enterprise** (Vertex AI Search / Discovery Engine) Search API를 테스트하고, 다양한 파라미터를 실시간으로 토글하며, **원본 응답 데이터(Raw JSON)**를 즉시 검증할 수 있는 개발자 친화형 웹 프론트엔드 도구입니다.

> ⚡ **Zero-Vercel Stack**: Node/Vercel 의존성 없이 순수 **Python (FastAPI)** 와 모던 경량 프론트엔드로 동작하며, 로컬 환경(`127.0.0.1:8000`)에서 단일 명령어로 즉시 실행됩니다.

---

## 🌟 주요 기능

### 1. 실시간 파라미터 토글 & 튜닝 컨트롤러
- **Gemini 요약 스펙 (`summarySpec`)**:
  - 생성형 AI 요약 활성화/비활성화 토글
  - `summaryResultCount` (요약에 참조할 상위 문서 개수: 1~10)
  - `includeCitations` (요약문 내 인용 출처 `[1]`, `[2]` 각주 포함 여부)
  - `generatePrunedSummary` (간결한 정제 요약 여부)
  - `ignoreAdversarialQuery`, `ignoreNonSummarySeekingQuery`, `ignoreLowRelevantContent` (안전성 및 필터링)
  - `languageCode` (한국어 `ko`, 영어 `en`, 자동 감지)
  - `modelSpec.version` (`gemini-1.5-flash-002`, `gemini-1.5-pro-002`, `preview`, `default`)
  - `modelPromptSpec.preamble` (요약 어조/스타일 지침을 위한 커스텀 프롬프트)
  - `useSemanticChunks` (시맨틱 청크 활용 여부)
- **추출형 질의응답 (`extractiveContentSpec`)**:
  - `maxExtractiveAnswerCount` (문서 내 직접 답변 개수)
  - `maxExtractiveSegmentCount` (관련 단락 개수)
  - `returnExtractiveSegmentScore` (단락별 연관성 점수 반환)
  - `numPreviousSegments` & `numNextSegments` (단락 전후 문맥 개수)
- **스니펫 & 검색 단위 모드 (`snippetSpec` & `searchResultMode`)**:
  - `returnSnippet` & `maxSnippetCount`
  - `searchResultMode`: `DOCUMENTS` (전체 문서) vs `CHUNKS` (RAG 청크 단위)
  - 청크 전후 문맥 개수 (`numPreviousChunks`, `numNextChunks`)
- **쿼리 이해 & 보정 (`queryExpansionSpec`, `spellCorrectionSpec`, NL Understanding)**:
  - 쿼리 확장 자동/비활성화 (`AUTO` / `DISABLED`)
  - 원래 결과 우선 고정 (`pinUnexpandedResults`)
  - 오타 자동 교정 모드 (`AUTO` / `SUGGESTION_ONLY`)
  - 자연어 필터 자동 추출 (`filterExtractionCondition`)
- **필터, 정렬 & 부스트 스펙 (`filter`, `orderBy`, `boostSpec`, `facetSpecs`)**:
  - 필터 표현식 (예: `category: ANY("Security")`)
  - 부스트 조건 동적 추가/삭제 (조건별 가중치 `-1.0 ~ 1.0` 슬라이더)
  - 패싯 집계 키 설정 (예: `category, author, file_type`)

---

### 2. 3단계 분석 뷰 (Results, Raw JSON, cURL)

| 탭 | 설명 |
|---|---|
| 🌟 **시각적 검색 결과** | Gemini Grounded 요약 카드(클릭 시 해당 원본 문서로 스크롤 및 하이라이트되는 인터랙티브 각주), 직접 답변, 검색 문서 목록, StructData 메타데이터 드로어, 패싯 카운트 |
| 📦 **원본 데이터 (Raw JSON)** | **(고객사 검증 핵심)** API에서 반환된 원본 JSON 전체를 문법 하이라이팅으로 확인, 실시간 키워드 필터링, **1클릭 전체 복사**, **타임스탬프 기반 .json 파일 다운로드** |
| 🛠️ **요청 명세 & cURL** | 현재 토글 상태로 동적 생성된 Request JSON 페이로드 확인, 터미널에서 즉시 재현 가능한 `curl` 명령어 자동 생성 및 복사 |

---

### 3. 유연한 실행 모드 (Mock vs Live GCP API)
1. **시뮬레이터 모드 (Mock)**:
   - 아직 고객사의 데이터스토어가 준비되지 않았거나 오프라인 환경에서도 모든 파라미터 토글과 실제 Vertex AI Search의 응답 구조(요약, 인용 출처, 직접 답변, 패싯 등)를 즉시 시뮬레이션할 수 있습니다.
2. **실제 GCP API 모드 (Live)**:
   - 로컬 `gcloud` Application Default Credentials(ADC) 또는 커스텀 Bearer Token을 통해 실제 Google Cloud Discovery Engine Search API를 직접 호출합니다.

---

## 🚀 빠른 시작 (Quick Start)

### 1. 패키지 설치
Python 3.9+ 환경에서 실행합니다. (이미 환경에 설치되어 있을 수 있습니다)
```bash
pip install -r requirements.txt
```

### 2. 로컬 서버 실행
```bash
python3 main.py
```
서버가 시작되면 브라우저에서 아래 주소로 접속합니다:
👉 **`http://127.0.0.1:8000`**

### 3. 실제 GCP 연동 시 (선택사항)
로컬 gcloud 계정으로 인증되어 있는 경우 자동으로 프로젝트와 인증 토큰을 감지합니다:
```bash
gcloud auth application-default login
gcloud config set project <PROJECT_ID>
```
또는 웹 UI 상단의 `Custom Bearer Token` 입력란에 `gcloud auth print-access-token`으로 발급받은 토큰을 직접 붙여넣어 테스트할 수 있습니다.

---

## 📁 프로젝트 구조

```
vais-stream-assist-test/
├── main.py              # FastAPI 서버 (BFF 프록시, 파라미터 빌더, 모의 엔진, 보안 헤더)
├── requirements.txt     # Python 의존성 목록
├── static/
│   ├── index.html       # 모던 대시보드 UI 마크업 (반응형 2-Column 레이아웃)
│   ├── app.js           # 프론트엔드 상태 관리, 파라미터 수집, Raw JSON 뷰어, cURL 생성
│   └── styles.css       # Gemini 테마 스타일, 인용 뱃지 애니메이션, 구문 강조
├── test_app.py          # 엔드포인트 및 파라미터 빌더 단위 테스트
└── README.md            # 본 사용 가이드 문서
```

---

## 🔒 보안 준수 사항 (Security Standards)
- **Localhost 바인딩**: 외부 노출 방지를 위해 서버는 `127.0.0.1`로만 바인딩됩니다.
- **BFF (Backend-For-Frontend) 아키텍처**: 클라이언트 브라우저에 GCP 자격증명이나 시크릿을 노출하지 않고 서버 측 프록시를 통해 안전하게 처리합니다.
- **보안 헤더**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, strict CSP 등이 기본 적용됩니다.
