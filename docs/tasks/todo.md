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

- [ ] **PDF 공시자료까지 AI 분석에 포함**
  - 현재: `src/lib/financial-page-detector.ts`가 BS / IS / CF / 자본변동표 4종 페이지만 키워드 스코어링으로 골라 AI에 전달. 사업보고서 PDF의 감사의견·이사회 보고·사업의 내용·주석·위험요인 등 **공시 본문은 거의 전부 잘림**.
  - 사용자 기대: 공시자료(주석, 감사의견 등)도 AI 분석에 포함되어 인사이트 풍부화.
  - 작업 항목:
    - [ ] 옵션 1: 디텍터를 확장해 "주석", "감사보고서", "사업의 내용" 등의 페이지 종류도 잡도록 키워드 추가 (선별적 확장)
    - [ ] 옵션 2: 사용자 토글 ("재무제표만" vs "전체 PDF") — 후자는 토큰 비용 ↑↑
    - [ ] 토큰 비용 가드: `MAX_INPUT_CHARS`(현재 20_000자) 상향 시 잘림 동작 확인 + provider별 context window 차이 고려

- [ ] **DART 감사·이사 정보를 AI 분석에 포함**
  - 현재: `useDartData.loadFinancialData`가 `audit` 액션으로 감사 정보를 fetch하지만, `OptimizedDataView`(`features/dart/components/OptimizedDataView.tsx:44`)가 AI에 보내는 페이로드는 재무 JSON(`jsonStr`)만. `auditData`는 별도 탭에서 화면 표시만 됨.
  - 사용자 기대(추정): "공시자료"가 AI 분석에 반영.
  - 작업 항목:
    - [ ] `OptimizedDataView`의 `extract` 호출 페이로드에 `auditData`(감사인·감사의견·감사보수 등) 합쳐 보내기
    - [ ] `prompt.txt` 또는 `extract` 라우트의 시스템 프롬프트에 "감사 정보 활용 지침" 추가
    - [ ] `dart` 액션을 추가해 사업보고서 본문(IRDS 외 다른 공시) 같이 가져올지 검토 (스코프 ↑)

## D. 본 세션 컨텍스트 (재개 시 참고)

- PDF 내보내기는 **이미 구현됨** (`src/lib/pdf-generator.ts` — `downloadPdf`, `downloadFullReportPdf`). 중복 제안 금지.
- 사이드바에 회사 13개 분석 페이지가 있고, 슬라이드 컴포넌트 + 멀티 AI 클라이언트 + Prisma DB는 갖춰진 상태.
- 신규 기능 제안 전에는 먼저 grep/read로 기존 구현 확인 필수.
