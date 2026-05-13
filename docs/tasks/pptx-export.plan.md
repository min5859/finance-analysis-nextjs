# PPTX 직접 생성 — 작업 계획

> 설계 문서: [pptx-export.design.md](./pptx-export.design.md)
> 시작: 2026-05-14

각 페이즈는 독립 커밋. lint·build·(가능 시) test 통과를 확인 후 다음 페이즈로.

---

## Phase A — 설계·계획 문서

- [x] `docs/tasks/pptx-export.design.md` 작성
- [x] `docs/tasks/pptx-export.plan.md` 작성 (본 문서)
- [x] 커밋

---

## Phase B — pptxgenjs 도입 + 핵심 인프라

- [ ] `pptxgenjs` 의존성 추가 (`npm install pptxgenjs`)
- [ ] `src/lib/pptx-export.ts` 신설
  - [ ] `buildCompanyPptx(data: CompanyFinancialData): Promise<Blob>` 시그니처
  - [ ] `downloadCompanyPptx(data: CompanyFinancialData): Promise<void>` (Blob → 다운로드)
  - [ ] 색상 토큰 (COLOR_PALETTE 재사용, hex 변환 헬퍼)
  - [ ] 슬라이드 마스터: 좌상단 제목·우상단 회사명·하단 페이지 번호
- [ ] 단순 표지 슬라이드 1장만 생성하는 단계로 첫 동작 확인
- [ ] lint·build 통과
- [ ] 커밋

---

## Phase C — 텍스트·표 슬라이드

- [ ] 표지 슬라이드 마무리 (회사명·업종·연도·생성일)
- [ ] 요약 슬라이드 (메트릭 6장 + F-Score 점수·부실 신호 라벨·위험 신호 카운트)
- [ ] 인사이트 텍스트 슬라이드 골격 (BS/IS/CF 인사이트 텍스트 출력)
- [ ] 결론 슬라이드 (강점·약점·전략 추천 불릿)
- [ ] 가치평가 슬라이드 (보수/기본/낙관 시나리오 표)
- [ ] lint·build 통과
- [ ] 커밋

---

## Phase D — 차트 슬라이드 (pptxgenjs native)

- [ ] LINE 차트 헬퍼 (시계열 데이터셋 N개 → pptxgenjs ChartType.line)
- [ ] BAR 차트 헬퍼
- [ ] RADAR 차트 헬퍼 (작동 여부 확인 → 안 되면 표 대체)
- [ ] 슬라이드 매핑:
  - [ ] 손익계산서 (LINE × 2)
  - [ ] 재무상태표 (BAR)
  - [ ] 성장성 (LINE)
  - [ ] 수익성 (LINE)
  - [ ] 안정성 (LINE)
  - [ ] 현금흐름 (BAR)
  - [ ] 운전자본 (BAR)
  - [ ] 업계비교 (RADAR or 표)
  - [ ] 가치평가 (BAR — 3 시나리오)
- [ ] lint·build 통과
- [ ] 커밋

---

## Phase E — UI 통합 + 검증

- [ ] `src/components/layout/Header.tsx` 에 PPTX 버튼 추가
- [ ] selectedCompany 기준 활성화 (CSV 버튼과 동일 패턴)
- [ ] 로딩 표시 처리
- [ ] 실데이터 1개로 다운로드 테스트 (수동)
- [ ] PowerPoint·Keynote 양쪽에서 열기 확인 (수동)
- [ ] 한글 깨짐·차트 색상·페이지 번호 검증
- [ ] lint·build 통과
- [ ] 커밋

---

## 검증 체크리스트 (전체 작업 후 1회)

- [ ] 12 슬라이드 모두 출력
- [ ] 한글 깨짐 없음
- [ ] 차트 데이터가 화면 차트와 일치
- [ ] 표 행/열 정렬 깔끔
- [ ] 파일 크기 < 2MB (네이티브 차트 기준)
- [ ] 생성 시간 < 3s (회사 1개 기준)
- [ ] PowerPoint 에서 차트 셀 우클릭 → 데이터 편집 가능

## 회수 / 후속 작업

- [ ] 트레이드오프 8.2 (PNG 폴백) 가 필요해진 슬라이드 식별
- [ ] PDF vector 직접 생성 트랙 별도 설계 문서 작성
- [ ] CI/로고 입히기
