# PDF Download Planning Document

> **Summary**: 재무 분석 결과를 PDF로 다운로드하는 기능 추가
>
> **Project**: Financial Analysis Dashboard (frontend)
> **Version**: 0.1.0
> **Author**: AI
> **Date**: 2026-02-16
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

현재 재무 분석 결과는 웹 브라우저에서만 확인 가능하다. 분석 결과를 PDF 파일로 다운로드하여 오프라인 공유, 보고서 제출, 인쇄 등에 활용할 수 있도록 한다.

### 1.2 Background

- 기업 실사(Due Diligence) 및 M&A 과정에서 재무 분석 보고서를 PDF로 전달하는 수요가 있음
- 현재 데이터 구조(`useFinancialData`, 각 page 컴포넌트)를 그대로 활용 가능
- DB 없이 클라이언트에 로드된 데이터만으로 구현 가능

---

## 2. Scope

### 2.1 In Scope

- [ ] 개별 시트(페이지) PDF 다운로드 — 현재 보고 있는 페이지만 PDF로 저장
- [ ] 통합 리포트 PDF 다운로드 — 전체 분석 결과를 하나의 PDF로 생성
- [ ] PDF에 차트(Chart.js) 포함
- [ ] PDF에 회사명, 날짜 등 헤더/푸터 포함
- [ ] 다운로드 버튼 UI (사이드바 또는 헤더)

### 2.2 Out of Scope

- PDF 서버사이드 생성 (클라이언트 사이드에서 처리)
- PDF 템플릿 커스터마이징 UI
- PDF 이메일 전송 기능

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 현재 페이지를 PDF로 다운로드 | High | Pending |
| FR-02 | 전체 시트를 하나의 통합 PDF로 다운로드 | High | Pending |
| FR-03 | Chart.js 차트가 PDF에 이미지로 포함됨 | High | Pending |
| FR-04 | PDF 헤더에 회사명, 생성일자 표시 | Medium | Pending |
| FR-05 | PDF 푸터에 페이지 번호 표시 | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 통합 PDF 생성 10초 이내 | 브라우저 콘솔 타이밍 |
| UX | 생성 중 로딩 인디케이터 표시 | 수동 확인 |
| 호환성 | Chrome, Edge, Safari에서 동작 | 수동 테스트 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 개별 페이지 PDF 다운로드 동작 확인
- [ ] 통합 리포트 PDF 다운로드 동작 확인
- [ ] 차트가 PDF에 정상 렌더링됨
- [ ] 빌드 에러 없음 (`npm run build`)

### 4.2 Quality Criteria

- [ ] Zero lint errors
- [ ] Build succeeds
- [ ] 한글 텍스트 깨짐 없음

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Chart.js canvas가 PDF에서 빈 이미지로 출력 | High | Medium | html2canvas로 차트를 이미지로 변환 후 삽입 |
| 통합 PDF 생성 시 메모리 부족 (페이지 수 많음) | Medium | Low | 페이지별 순차 렌더링, 진행률 표시 |
| 한글 폰트 미지원 | High | Medium | 브라우저 기본 폰트 활용 (html2canvas 방식이면 문제 없음) |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites, portfolios | ☐ |
| **Dynamic** | Feature-based modules, services layer | Web apps with backend, SaaS MVPs | ☑ |
| **Enterprise** | Strict layer separation, DI, microservices | High-traffic systems | ☐ |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| PDF 라이브러리 | html2canvas + jsPDF / react-pdf / puppeteer | html2canvas + jsPDF | 클라이언트 사이드, 차트 포함 용이, 추가 서버 불필요 |
| 다운로드 범위 | 개별 페이지만 / 통합만 / 둘 다 | 둘 다 | 사용자 유연성 |
| UI 위치 | 사이드바 / 헤더 / 페이지 내 | 헤더 | 모든 페이지에서 접근 가능 |

### 6.3 구현 방식

```
클라이언트 사이드 PDF 생성 흐름:
┌─────────────────────────────────────────────┐
│ 1. 사용자가 다운로드 버튼 클릭               │
│ 2. html2canvas로 대상 DOM을 캡처            │
│ 3. jsPDF로 캡처 이미지를 PDF에 삽입          │
│ 4. 파일명: {회사명}_report_{날짜}.pdf       │
│ 5. 브라우저에서 자동 다운로드                 │
└─────────────────────────────────────────────┘

통합 리포트:
┌─────────────────────────────────────────────┐
│ 각 페이지 컴포넌트를 숨겨진 div에 렌더링 후  │
│ 순차적으로 캡처 → PDF 페이지로 추가          │
└─────────────────────────────────────────────┘
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [x] ESLint configuration
- [x] TypeScript configuration (`tsconfig.json`)

### 7.2 Environment Variables Needed

해당 기능에 추가 환경변수 불필요 (클라이언트 사이드 전용)

---

## 8. Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/pdf-generator.ts` | NEW | PDF 생성 유틸리티 (html2canvas + jsPDF) |
| `src/components/layout/Header.tsx` | MODIFY | PDF 다운로드 버튼 추가 |
| `package.json` | MODIFY | html2canvas, jspdf 패키지 추가 |

---

## 9. Next Steps

1. [ ] Design document 작성 (`pdf-download.design.md`)
2. [ ] 구현 시작
3. [ ] 테스트 및 검증

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-16 | Initial draft | AI |
