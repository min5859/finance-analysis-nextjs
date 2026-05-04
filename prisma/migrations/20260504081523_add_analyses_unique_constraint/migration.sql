-- CreateIndex
CREATE UNIQUE INDEX "analyses_company_id_report_year_provider_key" ON "analyses"("company_id", "report_year", "provider");
