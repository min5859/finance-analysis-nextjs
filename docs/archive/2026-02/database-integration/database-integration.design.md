# Design: Database Integration

## Overview

Replace file-based JSON storage (`src/data/companies/*.json`) with PostgreSQL + Prisma.
All existing API routes that read/write JSON files will be rewritten to use Prisma queries.

## Database Schema

### 1. Company
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | auto-generated |
| name | String | company name |
| nameEng | String? | English name |
| corpCode | String? | DART corp code |
| stockCode | String? | stock ticker |
| sector | String? | industry sector |
| isListed | Boolean | default true |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

- Unique constraint: `[name, corpCode]`
- Table: `companies`

### 2. FinancialStatement
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | auto-generated |
| companyId | UUID (FK) | -> Company.id |
| year | String | fiscal year |
| source | Enum | dart / manual / upload |
| statementType | Enum | BS / IS / CF |
| items | Json | raw financial items |
| createdAt | DateTime | auto |

- Unique constraint: `[companyId, year, source, statementType]`
- On delete: Cascade
- Table: `financial_statements`

### 3. Analysis
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | auto-generated |
| companyId | UUID (FK) | -> Company.id |
| reportYear | String | analysis year |
| provider | String | AI provider name |
| financialData | Json | full CompanyFinancialData |
| createdAt | DateTime | auto |

- Index: `[companyId, reportYear]`
- On delete: Cascade
- Table: `analyses`

### 4. Valuation
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | auto-generated |
| analysisId | UUID (FK) | -> Analysis.id |
| provider | String | AI provider name |
| result | Json | valuation result JSON |
| createdAt | DateTime | auto |

- On delete: Cascade
- Table: `valuations`

## Infrastructure

### Docker Compose
- PostgreSQL 16 Alpine
- Port: 5432
- Credentials: fa_user / fa_pass / fa_db
- Volume: pgdata (persistent)

### Environment
- `DATABASE_URL=postgresql://fa_user:fa_pass@localhost:5432/fa_db`

## Implementation Files

| File | Action | Description |
|------|--------|-------------|
| `docker-compose.yml` | NEW | PostgreSQL 16 container |
| `prisma/schema.prisma` | NEW | 4 models, enums, relations |
| `src/lib/prisma.ts` | NEW | PrismaClient singleton |
| `src/app/api/companies/route.ts` | REWRITE | GET: findMany, POST: upsert + analysis create |
| `src/app/api/companies/[name]/route.ts` | REWRITE | GET: findFirst latest analysis |
| `src/app/api/valuation/route.ts` | MODIFY | Add optional DB save |
| `prisma/seed.ts` | NEW | JSON file -> DB migration |
| `.env.example` | MODIFY | Add DATABASE_URL |
| `.gitignore` | MODIFY | Add prisma generated |
| `package.json` | MODIFY | Add prisma, @prisma/client, db scripts |

## API Changes

### GET /api/companies
- Before: `fs.readdirSync()` reading JSON files
- After: `prisma.company.findMany()` with id/name/sector select
- Response shape preserved: `{ filename, name, sector }[]`

### POST /api/companies
- Before: `fs.writeFileSync()` saving JSON
- After: `prisma.company.upsert()` + `prisma.analysis.create()`
- Request body: `{ company_name, company_code?, sector?, report_year?, ...financialData }`
- Response: `{ success: true, filename: company.id }`

### GET /api/companies/[name]
- Before: `fs.readFileSync()` reading JSON by filename
- After: `prisma.analysis.findFirst()` latest by companyId
- `name` parameter is now company UUID (was filename)
- Returns `financialData` JSON directly

### POST /api/valuation
- Before: AI call only, no persistence
- After: AI call + optional `prisma.valuation.create()` when analysis_id provided
- DB save failure silently caught (still returns AI result)

## Seed Script
- Reads `src/data/companies/*.json`
- For each: upsert Company + create Analysis record
- Provider: 'seed' (to distinguish from runtime data)

## Dependencies
- `prisma: ^6.19.2`
- `@prisma/client: ^6.19.2`
- `tsx: ^4.21.0` (devDep, for seed script)

## Package.json Scripts
- `db:migrate`: `prisma migrate dev`
- `db:seed`: `npx tsx prisma/seed.ts`
- `db:reset`: `prisma migrate reset`
