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

- [ ] **DB 데이터 삭제 기능 (현재 전무)**
  - API에 `DELETE` 핸들러 없음, 클라이언트에 삭제 호출 없음. 한번 저장되면 Prisma Studio/SQL로만 제거 가능.
  - 다행히 `Company → FinancialStatement / Analysis → Valuation` 모두 `onDelete: Cascade` 설정되어 있어 구현은 가벼움.
  - 작업 항목:
    - [ ] `src/app/api/companies/[name]/route.ts`에 `DELETE` 핸들러 추가
    - [ ] 사이드바/summary 페이지에 휴지통 아이콘 + 확인 다이얼로그 (회사명 직접 입력 가드 권장)
    - [ ] 삭제 후 Zustand `company-store`에서 선택 회사 초기화 + 라우터 리프레시
    - [ ] (옵션) 세밀한 단위 삭제 — 특정 연도 재무제표만, 특정 provider 분석만

- [ ] **`analyses` 테이블 누적 이슈**
  - 같은 회사를 여러 번 분석하면 `prisma.analysis.create`만 호출되어 row가 무한 누적됨.
  - `[name]/route.ts`는 `orderBy: { createdAt: 'desc' }` + `findFirst`로 최신만 읽음 → 과거 row는 사용처 없이 쌓이기만 함.
  - 작업 항목:
    - [ ] 정책 결정: (a) 같은 `(companyId, reportYear, provider)`는 upsert로 갱신, (b) 최신 N개만 유지, (c) 히스토리로 의도적 보존
    - [ ] 정책에 따라 `companies/route.ts:78` 수정 또는 정리 작업 추가

- [ ] **`financial_statements` 모델 미사용 (Dead Schema)**
  - `prisma/schema.prisma`에 정의돼 있지만 코드 어디에서도 `prisma.financialStatement.*` 호출 없음.
  - 모든 BS/IS/CF가 `analyses.financialData` JSON에 묶여 들어감.
  - 작업 항목:
    - [ ] 정규화 활성화 vs 모델 제거 방향 결정
    - [ ] (활성화 시) 마이그레이션 + 저장/조회 경로 작성

- [ ] **`provider` 하드코딩**
  - `companies/route.ts:82`에서 `provider: 'anthropic'` 고정. 멀티 프로바이더(`ai-client`는 Anthropic/DeepSeek 지원)가 DB 레벨에 반영 안 됨.
  - 작업 항목:
    - [ ] POST 페이로드에서 실제 사용된 provider를 받아 저장하도록 수정

- [ ] **`valuation` 저장이 silent best-effort**
  - `valuation/route.ts:80-82` — DB 저장 실패해도 빈 catch로 무시. 의도된 동작인지, 로깅이라도 필요한지 확인.
  - 작업 항목:
    - [ ] 의도 확인 후 최소한 `console.error` 또는 `handleApiError` 호출

## C. 본 세션 컨텍스트 (재개 시 참고)

- PDF 내보내기는 **이미 구현됨** (`src/lib/pdf-generator.ts` — `downloadPdf`, `downloadFullReportPdf`). 중복 제안 금지.
- 사이드바에 회사 13개 분석 페이지가 있고, 슬라이드 컴포넌트 + 멀티 AI 클라이언트 + Prisma DB는 갖춰진 상태.
- 신규 기능 제안 전에는 먼저 grep/read로 기존 구현 확인 필수.
