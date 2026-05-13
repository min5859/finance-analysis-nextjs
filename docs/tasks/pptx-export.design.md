# PPTX 직접 생성 — 설계 문서

> 작성: 2026-05-14
> 상태: 초안 (구현 진행 중)

## 1. 배경 / 목적

현재 PDF 다운로드는 `html2canvas` 로 화면을 캡처해 jsPDF 에 이미지로 붙이는
방식이다. 결과물:

- 텍스트 검색·복사 불가 (이미지)
- 받은 사람이 편집 불가
- 파일 크기 크고 폰트 풀 임베드
- 차트가 캡처 시점의 픽셀에 종속 → 화면 크기·zoom 에 따라 결과가 다름

본 작업은 **CompanyFinancialData JSON 으로부터 PPTX 를 직접 생성**한다.
출력은 PowerPoint·Keynote 에서 그대로 열 수 있고, 텍스트·표·차트가 모두
네이티브 객체이므로 사용자가 슬라이드를 자유롭게 편집·재배치 가능하다.

### 비목적

- PDF vector 직접 생성 (한글 폰트 임베딩 비용 큼 → 후속 트랙)
- Word/Excel 호환 출력
- 영문 / 다국어 — 초기 버전은 한국어 고정
- 회사 CI 컬러·로고 자동 적용 — 초기는 기본 팔레트 (COLOR_PALETTE) 만

## 2. 라이브러리 선정

| 후보 | 채택? | 사유 |
|---|---|---|
| **pptxgenjs** | ✅ | 브라우저·Node 양쪽 동작, 한글 시스템 폰트 사용, 표/차트/도형 네이티브 객체, MIT, 활발한 유지 |
| docx + python-pptx | ❌ | 서버 측 별도 런타임 필요 |
| 차트만 별도: chart.js → PNG | △ | 1차는 pptxgenjs 네이티브 차트로. 한계가 보이면 PNG 폴백 |

## 3. 슬라이드 매핑

`src/lib/slide-config.ts` 의 `reportSlides` 12장 → PPTX 슬라이드. 1:1 매핑을
기본으로 하되, 텍스트가 적은 슬라이드는 통합한다.

| # | 슬라이드 | 본문 구성 | 차트 |
|---|---|---|---|
| 1 | 표지 | 회사명·업종·보고연도·생성일 | — |
| 2 | 요약 | MetricCard 6장 + F-Score / 부실 신호 / 위험 신호 | — |
| 3 | 손익계산서 | 매출/영업이익/순이익 표 + 이익률 표 | LINE (매출/이익 3년) + LINE (이익률) |
| 4 | 재무상태표 | 총자산/총부채/자본총계 표 | BAR (3년 추이) |
| 5 | 성장성 분석 | 성장률 표 + 인사이트 | LINE (성장률 3종) |
| 6 | 수익성 분석 | ROE/ROA/이익률 표 + 듀폰 | LINE (ROE/ROA) |
| 7 | 안정성 분석 | 부채/유동/이자보상 표 + 등급 | LINE (3지표 dual axis) |
| 8 | 현금흐름 | OCF/ICF/FCF 표 + 인사이트 | BAR (CF 구성) |
| 9 | 운전자본 | DSO/DIO/DPO/CCC 표 | BAR (CCC 추이) |
| 10 | 업계비교 | 레이더 데이터 표 | RADAR |
| 11 | 종합 결론 | 강점·약점·전략 추천 (불릿) | — |
| 12 | 가치 평가 | 보수/기본/낙관 시나리오 표 | BAR (3 시나리오 비교) |

표지·결론은 차트 없음. 그 외 9장은 본문 좌측 표 + 우측 차트의 2단 레이아웃.

## 4. 레이아웃 룰

- 슬라이드 크기: 16:9 (`pptx.layout = 'LAYOUT_WIDE'`, 13.33 × 7.5 in)
- 안전 영역: 0.5 in margin
- 색상: `src/components/charts/chartConfig.ts` 의 `COLOR_PALETTE` 재사용
- 폰트: 본문 Noto Sans KR 16pt, 제목 22pt, 캡션 10pt
- 슬라이드 마스터: 좌상단에 슬라이드 제목, 우상단에 회사명·연도, 하단 바에 페이지 번호

## 5. 차트 변환 전략

**1차 (Phase D): pptxgenjs 네이티브 차트**
- LINE, BAR 는 pptxgenjs 의 `ChartType.line`, `ChartType.bar` 직매핑
- 색상은 `COLOR_PALETTE` 의 hex 그대로 전달 (`color: 'F69D27'` 형태로 `#` 제거)
- y축 라벨·legend 위치만 옵션 지정

**RADAR 처리**
- pptxgenjs 는 RADAR 지원 (`ChartType.radar`). 그대로 시도. 안 되면 표만 표시하고 차트 생략.

**한계 / 추후 (선택)**
- 듀얼 y축 차트 (`LineChart` 의 yAxisID: 'y1') 가 pptxgenjs 에서 깔끔하지 않으면 단일 축으로 단순화.
- 더 정확한 시각 일치가 필요해지면 `chart.toBase64Image()` 로 PNG 추출해 임베드하는 방식으로 전환.

## 6. 데이터 입력 / 생성 위치

```
CompanyFinancialData (JSON)
        │
        ▼
buildCompanyPptx(data) ──► PptxBuilder ──► 슬라이드 12장 ──► Blob
        │                                                    │
        └─ src/lib/pptx-export.ts ─────────────────────────► download
```

- **클라이언트 측 생성**: 브라우저에서 `pptx.writeFile()` 직접 호출 → 다운로드.
- 서버 부담 0, AI/DART API 호출 없음.
- 회사 데이터는 이미 zustand store 에 hydrate 된 상태 → 추가 fetch 불필요.

## 7. UI 통합

- Header 컴포넌트에 `PPTX` 버튼 추가 (PDF / CSV / 공유 옆).
- 클릭 → `downloadCompanyPptx(companyData)` → 로딩 표시 → `.pptx` 다운로드.
- 회사가 선택되어 있어야 활성화 (기존 CSV 버튼과 동일 조건).

## 8. 트레이드오프

| 항목 | 결정 | 이유 |
|---|---|---|
| 네이티브 차트 vs PNG 임베드 | 네이티브 (1차) | 사용자가 차트 데이터 셀 편집 가능, 파일 크기 작음. 시각 일치는 약간 양보 |
| 한국어 폰트 | 시스템 폰트 (Noto Sans KR) | PowerPoint 가 자동 fallback. 폰트 임베딩 안 함 |
| 클라이언트 생성 | 채택 | 서버 부담 0, 비용 0, 즉시성 |
| 슬라이드 마스터 | 단순 구현 | 회사 CI 입히기는 후속 |
| AI 인사이트 텍스트 줄바꿈 | `\n` 그대로 + autoFit | 텍스트 길이가 슬라이드 넘으면 자동 줄임 |

## 9. 후속 / 확장 계획

- PDF vector 직접 생성 (`pdf-lib` + Noto Sans KR 임베드)
- 회사 CI/로고 슬라이드 마스터 (외부 자산 디렉토리에서 로드)
- 영문 슬라이드 옵션 (메트릭 라벨 번역 테이블)
- 시나리오 비교 슬라이드 (Bull/Base/Bear DCF 3종 — Phase 6 결과 활용)
- 슬라이드 선택적 출력 (사용자가 12장 중 일부만 선택)

## 10. 리스크

- pptxgenjs 가 RADAR / dual-axis 차트를 어색하게 렌더 → 1차에서 표만 보여주고 후속에 PNG 폴백 검토.
- 브라우저에서 큰 차트 데이터 (>1000 포인트) 처리 시 성능 — 본 프로젝트는 시계열 3~10 포인트라 무관.
- pptxgenjs 가 한글 깨짐 보고가 일부 있음 → Phase B 에서 실제 한국어 텍스트로 검증한 뒤 진행.
