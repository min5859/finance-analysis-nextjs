# Plan: Database Integration

## Summary

Replace file-based JSON storage with PostgreSQL database using Prisma ORM.
Enable multi-user support, cloud deployment, and query capabilities.

## Requirements

1. **Non-listed company support** - manual data input for unlisted companies
2. **Additional data for listed companies** - supplementary financials beyond DART
3. **User authentication** - multi-user access (future phase)
4. **Flexible deployment** - not locked to any specific cloud provider

## Approach

- PostgreSQL as database (widely supported, JSONB for complex data)
- Prisma ORM for type-safe DB access
- Docker Compose for local development
- Phased approach: Phase 1 (DB infra), Phase 2 (manual input UI), Phase 3 (auth)

## Scope (Phase 1)

- Docker Compose with PostgreSQL 16
- Prisma schema: Company, FinancialStatement, Analysis, Valuation
- Rewrite API routes from fs-based to Prisma queries
- Seed script for migrating existing JSON data
- Environment configuration (DATABASE_URL)
