# API Security Hardening Planning Document

> **Summary**: API 라우트 보안 취약점 수정 및 에러 핸들링 중앙화
>
> **Project**: Financial Analysis Dashboard (Next.js)
> **Author**: Claude
> **Date**: 2026-02-18
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

코드 품질 분석에서 발견된 API 라우트 보안 취약점을 수정한다. 내부 오류 정보 노출, 입력 검증 부재, Zod 스키마 우회 등 OWASP Top 10에 해당하는 이슈를 해결한다.

### 1.2 Background

전체 7개 API 라우트에서 `String(err)`로 내부 오류를 그대로 클라이언트에 반환하고 있으며, DART API 라우트는 쿼리 파라미터 검증 없이 외부 API URL에 직접 삽입하고 있다. Valuation/Companies 라우트는 `.passthrough()` 스키마로 임의 데이터를 수용한다.

### 1.3 Related Documents

- 코드 분석 결과: 품질 점수 82/100, 보안 이슈 8건 (Critical)

---

## 2. Scope

### 2.1 In Scope

- [x] 중앙화된 API 에러 핸들링 유틸리티 생성
- [x] 전체 7개 API 라우트의 에러 응답 안전화 (`String(err)` 제거)
- [x] DART API 라우트 입력 검증 추가 (corp_code, bsns_year, reprt_code)
- [x] Valuation/Companies Zod 스키마 `.passthrough()` 제거 및 명시적 필드 정의
- [x] `parse-ai-response.ts` JSON.parse 에러 핸들링 추가
- [x] Companies POST 라우트: `body` 대신 `parsed.data` 저장

### 2.2 Out of Scope

- Rate limiting (별도 feature로 진행)
- 인증/인가 시스템 추가
- `/api/config` 엔드포인트 접근 제한
- `extract/route.ts`의 `fs.readFileSync` 캐싱 최적화 (성능 이슈, 보안 아님)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `src/lib/api-error.ts` 유틸리티 생성 — 내부 오류는 서버 로그, 클라이언트에는 제네릭 메시지 | High | Pending |
| FR-02 | 7개 API 라우트의 catch 블록을 `handleApiError()` 로 교체 | High | Pending |
| FR-03 | `/api/dart` 쿼리 파라미터 Zod 검증: `corp_code` (8자리 숫자), `bsns_year` (4자리 숫자), `reprt_code` (5자리 숫자) | High | Pending |
| FR-04 | `/api/valuation` 스키마에서 `.passthrough()` 제거, 필요한 필드 명시 | High | Pending |
| FR-05 | `/api/companies` 스키마에서 `.passthrough()` 제거, `parsed.data`로 DB 저장 | High | Pending |
| FR-06 | `extractJsonFromAIResponse()`에 try/catch 추가, 파싱 실패 시 명확한 에러 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Security | 에러 응답에 스택 트레이스, 파일 경로, API 키 정보 미포함 | 수동 검증 |
| Security | 모든 외부 입력에 대한 런타임 검증 | Zod 스키마 검증 |
| Compatibility | 기존 클라이언트 코드 변경 불필요 (응답 구조 유지) | 빌드 성공 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [x] 모든 API 라우트에서 내부 오류 정보가 클라이언트에 노출되지 않음
- [x] DART API 라우트에 입력 검증 적용
- [x] `.passthrough()` 스키마 제거 완료
- [x] `npm run build` 성공
- [x] `npm run lint` 에러 없음

### 4.2 Quality Criteria

- [x] Zero lint errors
- [x] Build succeeds
- [x] 기존 기능 동작 유지 (클라이언트 응답 구조 변경 없음)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 에러 응답 구조 변경으로 클라이언트 에러 핸들링 깨짐 | Medium | Low | 기존 `{ error: string }` 구조 유지 |
| Zod 스키마 강화로 정상 요청이 거부됨 | Medium | Low | DART API 파라미터 패턴을 실제 사용 사례 기반으로 정의 |
| `.passthrough()` 제거로 필요한 필드가 누락됨 | High | Medium | companies POST의 `financialData` 저장은 별도 필드로 처리 |

---

## 6. Architecture Considerations

### 6.1 Project Level

| Level | Selected |
|-------|:--------:|
| **Dynamic** | :heavy_check_mark: |

### 6.2 Key Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| Error handling | 중앙 유틸리티 (`src/lib/api-error.ts`) | 7개 라우트 중복 코드 제거 |
| Validation | Zod (기존 사용 중) | 프로젝트 일관성 유지 |
| Logging | `console.error` (서버 측만) | 추가 의존성 없이 즉시 적용 |

### 6.3 수정 대상 파일

```
src/
├── lib/
│   ├── api-error.ts              # NEW - 에러 핸들링 유틸리티
│   └── parse-ai-response.ts      # MODIFY - JSON.parse 에러 핸들링
├── app/api/
│   ├── dart/route.ts             # MODIFY - 입력 검증 + 에러 핸들링
│   ├── extract/route.ts          # MODIFY - 에러 핸들링
│   ├── companies/route.ts        # MODIFY - 스키마 강화 + 에러 핸들링
│   ├── companies/[name]/route.ts # MODIFY - 에러 핸들링
│   ├── upload/route.ts           # MODIFY - 에러 핸들링
│   ├── valuation/route.ts        # MODIFY - 스키마 강화 + 에러 핸들링
│   └── config/route.ts           # NO CHANGE (보안 수준 낮음, out of scope)
```

---

## 7. Implementation Plan

### Phase 1: 에러 핸들링 유틸리티 (FR-01)
- `src/lib/api-error.ts` 생성
- `handleApiError(err, context)` 함수: 서버 로그 + 제네릭 응답

### Phase 2: DART API 입력 검증 (FR-03)
- Zod 스키마 정의: `dartFinancialSchema`, `dartSearchSchema`, `dartCompanyInfoSchema`, `dartAuditSchema`
- 각 action별 파라미터 검증 적용

### Phase 3: Zod 스키마 강화 (FR-04, FR-05)
- `/api/valuation`: `financial_data`에 주요 필드 명시, `.passthrough()` 제거
- `/api/companies`: `.passthrough()` 제거, `financialData` 필드를 별도 `z.record()` 로 정의, `parsed.data` 사용

### Phase 4: AI 응답 파싱 안전화 (FR-06)
- `extractJsonFromAIResponse()`에 try/catch 추가

### Phase 5: 전체 API 라우트 에러 핸들링 교체 (FR-02)
- 7개 라우트의 catch 블록을 `handleApiError()` 로 교체

---

## 8. Next Steps

1. [ ] Design document 작성 (`api-security-hardening.design.md`)
2. [ ] 구현 시작
3. [ ] Gap analysis 실행

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-18 | Initial draft | Claude |
