# API Security Hardening Design Document

> **Summary**: API 라우트 보안 취약점 수정 — 에러 핸들링 중앙화, 입력 검증 강화, 스키마 안전화
>
> **Project**: Financial Analysis Dashboard (Next.js)
> **Author**: Claude
> **Date**: 2026-02-18
> **Status**: Draft
> **Planning Doc**: [api-security-hardening.plan.md](../../01-plan/features/api-security-hardening.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- 모든 API 라우트에서 내부 오류 정보(스택 트레이스, 파일 경로, API 키)가 클라이언트에 노출되지 않도록 한다
- DART API 라우트에 쿼리 파라미터 입력 검증을 추가한다
- `.passthrough()` Zod 스키마를 명시적 필드 정의로 교체한다
- AI 응답 JSON 파싱에 에러 핸들링을 추가한다

### 1.2 Design Principles

- **최소 변경**: 기존 응답 구조(`{ error: string }`)를 유지하여 클라이언트 코드 변경 불필요
- **중앙화**: 반복되는 에러 핸들링 패턴을 단일 유틸리티로 통합
- **방어적 프로그래밍**: 모든 외부 입력(쿼리 파라미터, 요청 본문, AI 응답)에 검증 적용

---

## 2. Architecture

### 2.1 변경 전후 비교

```
[BEFORE] 현재 에러 흐름:
  Client ← { error: "Error: PrismaClientKnownRequestError: ..." } ← API Route
                    ↑ 내부 정보 노출

[AFTER] 개선된 에러 흐름:
  Client ← { error: "처리 중 오류가 발생했습니다." } ← handleApiError()
                                                           ↓
                                                    console.error (서버 로그만)
```

### 2.2 수정 파일 목록

| # | 파일 | 변경 유형 | 변경 내용 |
|---|------|----------|----------|
| 1 | `src/lib/api-error.ts` | **NEW** | 에러 핸들링 유틸리티 |
| 2 | `src/lib/parse-ai-response.ts` | MODIFY | JSON.parse try/catch 추가 |
| 3 | `src/app/api/dart/route.ts` | MODIFY | Zod 입력 검증 + handleApiError |
| 4 | `src/app/api/extract/route.ts` | MODIFY | handleApiError 적용 |
| 5 | `src/app/api/companies/route.ts` | MODIFY | 스키마 강화 + handleApiError |
| 6 | `src/app/api/companies/[name]/route.ts` | MODIFY | handleApiError 적용 |
| 7 | `src/app/api/upload/route.ts` | MODIFY | handleApiError 적용 |
| 8 | `src/app/api/valuation/route.ts` | MODIFY | 스키마 강화 + handleApiError |

---

## 3. Detailed Design

### 3.1 `src/lib/api-error.ts` (NEW)

```typescript
import { NextResponse } from 'next/server';

export function handleApiError(err: unknown, context: string): NextResponse {
  console.error(`[API:${context}]`, err);
  return NextResponse.json(
    { error: '처리 중 오류가 발생했습니다.' },
    { status: 500 },
  );
}
```

- `context`: 라우트 식별자 (예: `"dart"`, `"extract"`, `"companies"`)
- 서버 측 `console.error`로 디버깅 가능
- 클라이언트에는 제네릭 한국어 메시지만 반환
- 기존 `{ error: string }` 구조를 유지하여 클라이언트 호환성 보장

### 3.2 `src/app/api/dart/route.ts` — 입력 검증 추가

```typescript
import { z } from 'zod';
import { handleApiError } from '@/lib/api-error';

const corpCodeSchema = z.string().regex(/^\d{8}$/, '유효하지 않은 기업 코드입니다.');
const bsnsYearSchema = z.string().regex(/^\d{4}$/, '유효하지 않은 사업연도입니다.');
const reprtCodeSchema = z.string().regex(/^\d{5}$/, '유효하지 않은 보고서 코드입니다.');
```

**action별 검증:**

| action | 필수 파라미터 | 검증 규칙 |
|--------|-------------|----------|
| `search` | `query` (선택) | 길이 제한 없음 (기존 유지) |
| `financial` | `corp_code`, `bsns_year` | 8자리 숫자, 4자리 숫자 |
| `company-info` | `corp_code` | 8자리 숫자 |
| `audit` | `corp_code`, `bsns_year` | 8자리 숫자, 4자리 숫자 |

**검증 실패 시 응답:**
```json
{ "error": "유효하지 않은 기업 코드입니다." }  // 400
```

### 3.3 `src/app/api/valuation/route.ts` — 스키마 강화

**변경 전:**
```typescript
const valuationSchema = z.object({
  company_info: z.object({ corp_name: z.string(), sector: z.string().optional() }).passthrough(),
  financial_data: z.object({}).passthrough(),
  industry_info: z.object({}).passthrough().optional(),
  ...
});
```

**변경 후:**
```typescript
const valuationSchema = z.object({
  company_info: z.object({
    corp_name: z.string(),
    sector: z.string().optional(),
  }),
  financial_data: z.record(z.string(), z.unknown()),
  industry_info: z.record(z.string(), z.unknown()).optional(),
  provider: z.enum(['anthropic', 'openai', 'gemini', 'deepseek']).optional(),
  analysis_id: z.string().optional(),
});
```

- `.passthrough()` 제거 → `company_info`는 명시적 필드만 허용
- `financial_data`는 구조가 다양하므로 `z.record()` 사용 (임의 키-값은 허용하되 `.passthrough()` 없이)
- `industry_info`도 동일하게 `z.record()` 적용

### 3.4 `src/app/api/companies/route.ts` — 스키마 강화 + 데이터 저장 수정

**변경 전:**
```typescript
const companySaveSchema = z.object({
  company_name: z.string().min(1),
  company_code: z.string().optional(),
  sector: z.string().optional(),
  report_year: z.string().optional(),
}).passthrough();

// line 70: financialData: body  ← 검증되지 않은 원본 body 저장
```

**변경 후:**
```typescript
const companySaveSchema = z.object({
  company_name: z.string().min(1),
  company_code: z.string().optional(),
  sector: z.string().optional(),
  report_year: z.string().optional(),
  // 재무 데이터 전체를 별도 필드로 수용
  performance_data: z.record(z.string(), z.unknown()).optional(),
  balance_sheet_data: z.record(z.string(), z.unknown()).optional(),
  stability_data: z.record(z.string(), z.unknown()).optional(),
  cash_flow_data: z.record(z.string(), z.unknown()).optional(),
  working_capital_data: z.record(z.string(), z.unknown()).optional(),
  profitability_data: z.record(z.string(), z.unknown()).optional(),
  growth_rates: z.record(z.string(), z.unknown()).optional(),
  dupont_data: z.record(z.string(), z.unknown()).optional(),
  radar_data: z.record(z.string(), z.unknown()).optional(),
  insights: z.record(z.string(), z.unknown()).optional(),
  conclusion: z.record(z.string(), z.unknown()).optional(),
});

// 저장 시: financialData: parsed.data  ← 검증된 데이터 사용
```

### 3.5 `src/lib/parse-ai-response.ts` — 에러 핸들링 추가

**변경 전:**
```typescript
return JSON.parse(jsonStr);  // 파싱 실패 시 raw Error 전파
```

**변경 후:**
```typescript
try {
  return JSON.parse(jsonStr);
} catch {
  throw new Error('AI 응답을 JSON으로 파싱할 수 없습니다.');
}
```

### 3.6 나머지 API 라우트 — catch 블록 교체

모든 라우트의 catch 블록을 동일 패턴으로 교체:

```typescript
// 변경 전 (전체 7개 라우트)
} catch (err) {
  return NextResponse.json({ error: String(err) }, { status: 500 });
}

// 변경 후
} catch (err) {
  return handleApiError(err, 'route-name');
}
```

| 라우트 | context 값 |
|--------|-----------|
| `/api/dart` | `"dart"` |
| `/api/extract` | `"extract"` |
| `/api/companies` GET | `"companies-list"` |
| `/api/companies` POST | `"companies-save"` |
| `/api/companies/[name]` | `"companies-detail"` |
| `/api/upload` | `"upload"` |
| `/api/valuation` | `"valuation"` |

추가로 `upload/route.ts`의 `console.error('Upload error:', err)` 는 `handleApiError` 내부에서 처리되므로 제거.

---

## 4. Error Handling

### 4.1 에러 응답 체계

| HTTP Status | 사용 상황 | 응답 형태 |
|-------------|----------|----------|
| 400 | 입력 검증 실패 (Zod) | `{ error: "구체적 검증 메시지" }` |
| 401 | API 키 미설정 | `{ error: "KEY_NAME not configured" }` (기존 유지) |
| 404 | 리소스 없음 | `{ error: "Not found" }` (기존 유지) |
| 500 | 서버 내부 오류 | `{ error: "처리 중 오류가 발생했습니다." }` (제네릭) |

### 4.2 클라이언트 호환성

기존 클라이언트 코드가 사용하는 에러 패턴:
```typescript
// company-store.ts:47
if (!res.ok) throw new Error('기업 데이터를 불러올 수 없습니다.');
```

- 클라이언트는 `res.ok`로 에러를 판단하며 서버 에러 메시지를 직접 표시하지 않음
- 따라서 서버 에러 메시지 변경이 클라이언트에 영향 없음

---

## 5. Implementation Order

1. [ ] `src/lib/api-error.ts` 생성 (의존성 없는 유틸리티 먼저)
2. [ ] `src/lib/parse-ai-response.ts` JSON.parse 에러 핸들링 추가
3. [ ] `src/app/api/dart/route.ts` Zod 검증 + handleApiError 적용
4. [ ] `src/app/api/valuation/route.ts` 스키마 강화 + handleApiError 적용
5. [ ] `src/app/api/companies/route.ts` 스키마 강화 + handleApiError 적용
6. [ ] `src/app/api/companies/[name]/route.ts` handleApiError 적용
7. [ ] `src/app/api/extract/route.ts` handleApiError 적용
8. [ ] `src/app/api/upload/route.ts` handleApiError 적용 + console.error 제거
9. [ ] `npm run build` 검증
10. [ ] `npm run lint` 검증

---

## 6. Verification Criteria

- [ ] 모든 API 라우트의 catch 블록에서 `String(err)` 패턴이 0건
- [ ] DART 라우트에 잘못된 `corp_code` (예: `abc`) 전달 시 400 응답
- [ ] Valuation/Companies 스키마에서 `.passthrough()` 사용 0건
- [ ] `parse-ai-response.ts`에서 잘못된 JSON 입력 시 명확한 에러 메시지
- [ ] `npm run build` 성공
- [ ] `npm run lint` 에러 0건

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-18 | Initial draft | Claude |
