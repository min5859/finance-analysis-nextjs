# api-security-hardening Gap Analysis Report

> **Match Rate**: 100% (52/52 items)
>
> **Date**: 2026-02-18
> **Design Doc**: [api-security-hardening.design.md](../02-design/features/api-security-hardening.design.md)

---

## Overall Score

| Category | Items | Matched | Score |
|----------|:-----:|:-------:|:-----:|
| api-error.ts | 5 | 5 | 100% |
| dart/route.ts | 11 | 11 | 100% |
| valuation/route.ts | 7 | 7 | 100% |
| companies/route.ts | 19 | 19 | 100% |
| parse-ai-response.ts | 2 | 2 | 100% |
| Remaining routes | 4 | 4 | 100% |
| Verification criteria | 4 | 4 | 100% |
| **Total** | **52** | **52** | **100%** |

## File Status

| File | Status |
|------|--------|
| `src/lib/api-error.ts` | MATCH |
| `src/lib/parse-ai-response.ts` | MATCH |
| `src/app/api/dart/route.ts` | MATCH |
| `src/app/api/valuation/route.ts` | MATCH |
| `src/app/api/companies/route.ts` | MATCH |
| `src/app/api/companies/[name]/route.ts` | MATCH |
| `src/app/api/extract/route.ts` | MATCH |
| `src/app/api/upload/route.ts` | MATCH |

## Extra Items (Beneficial)

1. `dart/route.ts`: `reprt_code` 검증이 `validateCorpParams`에 추가됨 (설계 원칙과 일치)
2. `extract/route.ts`: 기존 Zod 스키마가 이미 적용되어 있어 추가 검증 불필요

## Conclusion

Match Rate 100% — iteration 불필요. Report 단계로 진행 가능.
