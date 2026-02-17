-- CreateEnum
CREATE TYPE "StatementSource" AS ENUM ('dart', 'manual', 'upload');

-- CreateEnum
CREATE TYPE "StatementType" AS ENUM ('BS', 'IS', 'CF');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_eng" TEXT,
    "corp_code" TEXT,
    "stock_code" TEXT,
    "sector" TEXT,
    "is_listed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_statements" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "source" "StatementSource" NOT NULL,
    "statement_type" "StatementType" NOT NULL,
    "items" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "report_year" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "financial_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "valuations" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "valuations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_corp_code_key" ON "companies"("name", "corp_code");

-- CreateIndex
CREATE UNIQUE INDEX "financial_statements_company_id_year_source_statement_type_key" ON "financial_statements"("company_id", "year", "source", "statement_type");

-- CreateIndex
CREATE INDEX "analyses_company_id_report_year_idx" ON "analyses"("company_id", "report_year");

-- AddForeignKey
ALTER TABLE "financial_statements" ADD CONSTRAINT "financial_statements_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valuations" ADD CONSTRAINT "valuations_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
