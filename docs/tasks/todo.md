# TODO — finance-analysis-nextjs

> 2026-05-02 대화에서 도출된 후보. 우선순위는 미정 — 사용자 확인 후 진행.

## A. 신규 기능 후보 (사용자에게 제안 → 선택 대기)

- [ ] **다중 회사 비교 워크스페이스**
  - 현재 `industry-comparison`은 산업 평균 비교만 가능. 사용자가 임의로 2~5개 회사를 골라 동일 KPI를 나란히 비교하는 페이지 추가.
  - 구현 포인트: Zustand `company-store`에 `selectedCompanies: string[]` 추가, 기존 차트 컴포넌트 재사용.
  - 트레이드오프: 회사 수가 많아질수록 차트 가독성 저하 (색상/라벨 충돌).

- [ ] **회사 데이터 Q&A 챗봇 (사이드 패널)**
  - `ai-client.ts` + 회사 JSON 데이터 위에서 자유 질의 ("왜 영업이익률이 떨어졌어?" 등) 받는 챗 UI.
  - 구현 포인트: 사이드 패널 컴포넌트, 메시지 상태 관리, prompt caching 또는 요약본 주입.
  - 트레이드오프: 토큰 비용 — 매 질의마다 재무 데이터 전체 전송 시 빠르게 누적. 캐싱 전략 필수.

- [ ] **분석 노트 + 회사 워치리스트**
  - 회사별 메모/태그/즐겨찾기를 Prisma DB에 저장.
  - 구현 포인트: 1~2개 새 모델 (`Note`, `Watchlist`) 추가.
  - 의존: 멀티 유저면 아래 **로그인/인증** 항목이 선결 과제.

- [ ] **로그인 / 인증 기능 (현재 전무)**
  - 검증: `next-auth`/`@auth`/`@clerk`/`@supabase`/`lucia` 등 의존성 0개, `signIn`/`getServerSession` 등 코드 호출도 0건.
  - 결정 필요 사항 (구현 전 사용자 확인):
    - [ ] **목적**: (a) 단순 비공개화(BasicAuth/단일 비밀번호) (b) 멀티 유저 + 데이터 분리 (c) 팀/조직 단위 협업 — 어느 쪽?
    - [ ] **인증 방식**: 이메일/비밀번호, OAuth(Google/GitHub), Magic Link, SSO 중 무엇?
    - [ ] **솔루션 선택**: Auth.js(NextAuth v5) / Clerk / Supabase Auth / Lucia / 자체 구현 — 트레이드오프 정리 후 결정
      - Auth.js: 무료, 셀프호스팅, Prisma Adapter 있어 현 스택과 호환 좋음. UI는 직접 작성.
      - Clerk: UI 컴포넌트 제공, 빠르게 도입. 유료 티어 존재, 외부 의존.
      - Supabase Auth: 이미 Postgres 쓰고 있어 자연스럽지만 Vercel Postgres에서 Supabase로 이관 필요.
  - 작업 항목 (Auth.js + Prisma Adapter 가정 시):
    - [ ] `prisma/schema.prisma`에 `User`, `Account`, `Session`, `VerificationToken` 모델 추가 + 마이그레이션
    - [ ] 기존 `Company`/`Analysis`/`Valuation`에 `userId` FK 추가할지 결정 (멀티유저면 필수, 데이터 분리 정책 정의)
    - [ ] `src/lib/auth.ts`로 Auth.js 설정, 환경변수 (`AUTH_SECRET`, OAuth 키 등) 추가
    - [ ] `src/middleware.ts`로 `(dashboard)` 라우트 그룹 보호
    - [ ] 로그인/로그아웃 UI (페이지 + Header 컴포넌트 메뉴)
    - [ ] API 라우트 전반에서 `getServerSession()` 검사 추가
    - [ ] 기존 데이터 마이그레이션 전략 (single-tenant → multi-tenant 전환 시)
  - 트레이드오프:
    - 도입 즉시 모든 기존 API가 인증 통과해야 동작 → 개발 흐름이 약간 무거워짐.
    - `userId` FK 추가는 깨질 수 있는 변경(breaking) → 데이터 있는 상태면 backfill 마이그레이션 필요.

## B. DB 관련 — 명확히 누락된 기능 / 잠재 이슈

- [x] **DB 데이터 삭제 기능** *(2026-05-04 완료, commit `a9a8d77`)*
  - `src/app/api/companies/[name]/route.ts`에 `DELETE` 핸들러 추가 (Cascade로 analysis/valuation 자동 삭제, P2025 → 404)
  - Sidebar에 휴지통 버튼 + 회사명 입력 가드 (`window.prompt`)
  - 삭제 후 `clearData()` + `loadCompanyList()` + `router.refresh()`
  - **남은 옵션**: 세밀한 단위 삭제 (특정 연도/provider) — 필요해질 때 추가

- [x] **`analyses` 테이블 누적 이슈** *(2026-05-04 완료, 정책 (a) Upsert 채택)*
  - `Analysis` 모델에 `@@unique([companyId, reportYear, provider])` 추가 (마이그레이션 `20260504081523_add_analyses_unique_constraint`)
  - `companies/route.ts`의 `analysis.create` → `analysis.upsert` 전환
  - **운영 적용 미완**: `prisma migrate deploy`를 운영 DB에 실행해야 함 (사용자 확인 후 진행)

- [ ] **`financial_statements` 모델 미사용 (Dead Schema)** — *2026-05-04 결정 보류 ("일단 그냥 두기")*
  - 운영 데이터 0행, 코드 미사용 상태로 그대로 둠.
  - 향후 다년도 비교 / raw 데이터 분리 저장이 필요해질 때 재검토 (활성화 vs 제거).

- [x] **`provider` 하드코딩** *(2026-05-04 완료, commit `5a6efc5`)*
  - `companySaveSchema`에 `provider` 추가 (optional, 4종 enum), `data.provider ?? 'anthropic'` fallback
  - 3개 caller (`page.tsx` ×2, `OptimizedDataView.tsx`)가 store의 `aiProvider`를 페이로드에 포함하도록 수정

- [x] **`valuation` 저장이 silent best-effort** *(2026-05-04 완료, commit `c790b58`)*
  - `catch (err) { console.error('[API:valuation] DB save failed ...', err); }` 로 변경. 응답은 그대로 반환 (best-effort 의도 보존).

## C. 기존 플로우 — 인식 vs 실제 동작 갭 *(2026-05-04 검증 결과)*

JSON / PDF / DART 3개 진입 플로우의 실제 동작을 코드 레벨로 확인한 결과, 사용자 인식과 다른 부분 3가지 발견. 각 항목은 우선순위 미정.

- [ ] **PDF 다중 업로드 지원**
  - 현재: `src/app/page.tsx:190` `useDropzone({ maxFiles: 1 })`, `onDrop`은 `acceptedFiles[0]`만 처리. 단일 파일 강제.
  - 사용자 기대: 여러 PDF를 한 번에 드래그해도 모두 분석 → 각 회사별로 저장.
  - 작업 항목:
    - [ ] `maxFiles` 해제 (또는 적정 상한 — 동시 LLM 호출 비용 고려해 5개 정도)
    - [ ] `onDrop`을 acceptedFiles 순회 루프로 변경. 파일별 `processPdfFile` 호출.
    - [ ] 진행 상태 UI를 파일별 진행으로 확장 (현재는 단일 ProcessState)
    - [ ] 동시성 제어 — Promise.all 병렬 vs 순차. 순차 권장 (LLM 비용/rate-limit)
    - [ ] 일부 실패 시 정책: 나머지 계속 vs 전체 중단. 각 파일 결과 collated 표시.

- [x] **PDF 공시자료까지 AI 분석에 포함** *(2026-05-04 Phase B로 자동 해결, commit `324cfe6`)*
  - 원래 문제: 키워드 기반 detector가 BS/IS/CF/자본변동표 4종 페이지만 추출 → 주석/감사의견/사업내용은 잘림.
  - **해결 경로**: Phase B로 detector 자체 (`src/lib/financial-page-detector.ts`) 제거. PDF를 통째로 AI에 전달하는 구조로 변경.
    - Anthropic: PDF 바이너리를 `document` content block으로 직접 전송 → 시각/OCR/주석/감사의견 모두 AI가 본문 그대로 봄
    - 다른 provider: 서버에서 `pdf-parse`로 전체 페이지 텍스트 → AI (옛 detector 우회)
  - 토큰 비용 가드: `MAX_INPUT_CHARS=20_000`은 텍스트 fallback 경로에서만 적용. Anthropic PDF 직접 입력은 페이지 수에 비례 (페이지당 ~1.5k vision 토큰).

- [ ] **DART 감사·이사 정보를 AI 분석에 포함**
  - 현재: `useDartData.loadFinancialData`가 `audit` 액션으로 감사 정보를 fetch하지만, `OptimizedDataView`(`features/dart/components/OptimizedDataView.tsx:44`)가 AI에 보내는 페이로드는 재무 JSON(`jsonStr`)만. `auditData`는 별도 탭에서 화면 표시만 됨.
  - 사용자 기대(추정): "공시자료"가 AI 분석에 반영.
  - 작업 항목:
    - [ ] `OptimizedDataView`의 `extract` 호출 페이로드에 `auditData`(감사인·감사의견·감사보수 등) 합쳐 보내기
    - [ ] `prompt.txt` 또는 `extract` 라우트의 시스템 프롬프트에 "감사 정보 활용 지침" 추가
    - [ ] `dart` 액션을 추가해 사업보고서 본문(IRDS 외 다른 공시) 같이 가져올지 검토 (스코프 ↑)

## G. ⚠️ 보안 부채 — Anthropic API key client-direct 노출 *(2026-05-04)*

Vercel Hobby 60s 함수 timeout 으로 큰 PDF 비전 분석이 서버 측에서 완료되지
않는 문제를 임시로 우회. 인증된 사용자에게 `ANTHROPIC_API_KEY` 를 그대로
내려주고 브라우저가 Anthropic SDK 로 직접 호출.

**현재 노출 표면**:
- `/api/anthropic-config` — auth() 통과 시 API key + system prompt 응답
- `src/lib/anthropic-browser.ts` — 키를 메모리에 로드해 `dangerouslyAllowBrowser: true` 로 SDK 호출
- 위 두 파일 모두 머리말에 ⚠️ TEMPORARY 마킹

**리스크**:
- 인증된 mnaikorea.com 사용자가 DevTools 로 키 추출 → 본인 외 용도로 무한 호출 가능
- rate limit / 비용 한도 무력화 가능
- 이메일 게이트는 비밀번호 없음 → 사실상 도메인 형식만 알면 누구나 접근

- [ ] **회수 (다음 중 하나 만족 시 즉시)**
  - [ ] (a) Vercel Pro 업그레이드 → maxDuration 300s 로 server-side 충분
  - [ ] (b) Google Cloud Run 마이그레이션 → 60min timeout
  - [ ] (c) 외부 워커 (Inngest 등) 도입 → polling 패턴
- [ ] **회수 시 작업**
  - [ ] `/api/anthropic-config` 라우트 삭제
  - [ ] `src/lib/anthropic-browser.ts` 삭제
  - [ ] `src/app/page.tsx` `processPdfFile` 의 anthropic 분기 제거 → server multipart 단일 경로로 복귀
  - [ ] `pdf-parse` 모듈 로드 이슈가 해결됐는지 검증 (Cloud Run 이면 OK, Vercel Pro 면 같은 이슈 잔존 가능)
- [ ] **임시 운영 시 추가 가드 (필요하면)**
  - [ ] Anthropic 측에서 별도 IP-allowlisted / 기간제 키 발급 → 일반 키 분리
  - [ ] 사용량 alert 설정 → 도용 시 빠른 인지

## F. 인증 — 향후 작업 *(2026-05-04 보류 사항)*

현재 구현 (commit `c99e369` + 이메일 게이트 전환): NextAuth v5 + Prisma
Adapter + JWT 세션. **임시로 이메일만 입력하는 게이트** 동작 중 (회사
도메인 `mnaikorea.com` 검증, 비밀번호 없음).

원래 계획은 **ERP와 동일한 Google OAuth 클라이언트 재사용**이었지만,
사용자가 회사 Google Cloud Console 접근 권한이 없어서 보류됨.

- [ ] **Google OAuth로 전환**
  - 사전 조건: 회사 Cloud Console 관리자에게 다음 둘 중 하나 요청
    - (a) ERP 의 OAuth 클라이언트에 redirect URI 두 개 추가 + ERP 의
      `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` 공유
      - `http://localhost:3030/api/auth/callback/google`
      - `https://finance-analysis-nextjs-wookis-projects-37b4f55c.vercel.app/api/auth/callback/google`
    - (b) finance 전용 새 OAuth 클라이언트 생성 (위 두 redirect URI 등록)
  - 받은 `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` 을 로컬 `.env.local` +
    Vercel env 에 등록 → 자동으로 Google 버튼 노출 (코드는 이미 conditional
    로 되어 있음).
  - 이메일 임시 게이트는 그대로 두거나(보조 경로) 제거할지 결정.
  - `src/auth.ts` 의 `signIn` 콜백 Google 분기에 이미 도메인/Workspace `hd`
    검증 로직 들어가 있음.

- [ ] **이메일 게이트의 보안 한계 인지**
  - 비밀번호 없음 → 회사 도메인 이메일만 알면 누구나 진입 가능. 임시 사용
    한정.
  - 운영에 노출하기 전에 위 OAuth 전환을 완료할 것.

## E. AI 분석 파이프라인 개선 *(2026-05-04 완료, `next_job.md` 기반)*

원래 `next_job.md`에 사용자가 적어두신 두 가지 개선 요청 — OCR 안 된 PDF 분석 실패 + AI JSON 출력 깨짐 — 을 두 단계로 처리.

- [x] **Phase A — Provider-native structured JSON output** *(commit `4b35d7a`)*
  - 이전: `chatCompletion()` + 정규식 기반 `extractJsonFromAIResponse()` 후처리. 자유 텍스트 생성이라 코드블록 누락/trailing comma/잘림 등으로 자주 깨짐.
  - 이후: `chatCompletionJson()` 신설. provider별 native 강제:
    - Anthropic: `tools` + `tool_choice: { type: 'tool', name }` (tool_use)
    - OpenAI: `response_format: json_schema` (schema 지정 시) / `json_object`
    - Gemini, DeepSeek: `response_format: json_object`
  - `parse-ai-response.ts` 삭제. `/api/extract`, `/api/valuation`이 새 함수 사용.

- [x] **Phase B — PDF 직접 AI 입력** *(commits `324cfe6`, `3a54846`, `5171bc5`)*
  - 이전: rule-based detector로 재무 페이지만 골라 텍스트만 AI에 전달. OCR 안 된 스캔본은 빈 텍스트, 누락도 잦음.
  - 이후: PDF 바이너리를 `/api/extract`에 multipart로 직접 업로드.
    - Anthropic: `document` content block으로 PDF 전달 → 모델이 자체 vision+OCR
    - 그 외: 서버에서 `pdf-parse` 텍스트 fallback
  - UI: dropzone 32MB 한도(이전 10MB) + "OCR converting" 체크박스 (체크 시 sidebar 설정 무시하고 anthropic 강제) + 분석 시작 확인 단계
  - 후속 정리: `report_year`/`company_code`가 number로 와도 통과하도록 `companySaveSchema` 강건화 (commit `5171bc5`)
  - 비용: Sonnet 4.6 기준 30페이지 PDF ≈ $0.20~$0.34 / 1건. ⚠️ Vercel Hobby plan은 4.5MB body 한계라 32MB까지 쓰려면 Pro 필요.

## D. 본 세션 컨텍스트 (재개 시 참고)

- PDF 내보내기는 **이미 구현됨** (`src/lib/pdf-generator.ts` — `downloadPdf`, `downloadFullReportPdf`). 중복 제안 금지.
- 사이드바에 회사 13개 분석 페이지가 있고, 슬라이드 컴포넌트 + 멀티 AI 클라이언트 + Prisma DB는 갖춰진 상태.
- 신규 기능 제안 전에는 먼저 grep/read로 기존 구현 확인 필수.
