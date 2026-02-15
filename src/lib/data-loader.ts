import type {
  CompanyFinancialData,
  PerformanceData,
  BalanceSheetData,
  StabilityData,
  CashFlowData,
  WorkingCapitalData,
  ProfitabilityData,
  GrowthRatesData,
  DupontData,
  RadarData,
  Insights,
  Conclusion,
} from '@/types/company';

export class DataLoader {
  private data: CompanyFinancialData;

  constructor(data: CompanyFinancialData) {
    this.data = this.processEmptyArrays(data as unknown as Record<string, unknown>) as unknown as CompanyFinancialData;
  }

  getCompanyName(): string {
    return this.data.company_name || '알 수 없음';
  }

  getSector(): string {
    return this.data.sector || '알 수 없음';
  }

  getReportYear(): string {
    return this.data.report_year || '';
  }

  getPerformanceData(): PerformanceData {
    return this.data.performance_data;
  }

  getBalanceSheetData(): BalanceSheetData {
    return this.data.balance_sheet_data;
  }

  getStabilityData(): StabilityData {
    return this.data.stability_data;
  }

  getCashFlowData(): CashFlowData {
    return this.data.cash_flow_data;
  }

  getWorkingCapitalData(): WorkingCapitalData {
    return this.data.working_capital_data;
  }

  getProfitabilityData(): ProfitabilityData {
    return this.data.profitability_data;
  }

  getGrowthRates(): GrowthRatesData {
    return this.data.growth_rates;
  }

  getDupontData(): DupontData {
    return this.data.dupont_data;
  }

  getRadarData(): RadarData {
    return this.data.radar_data;
  }

  getInsights(): Insights {
    return this.data.insights;
  }

  getConclusion(): Conclusion {
    return this.data.conclusion;
  }

  getAllData(): CompanyFinancialData {
    return this.data;
  }

  /** null/빈배열 → 0으로 치환 (기존 Python DataLoader 로직 동일) */
  private processEmptyArrays(data: Record<string, unknown>): Record<string, unknown> {
    const processed: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        processed[key] = this.processEmptyArrays(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        if (value.length === 0) {
          const yearArr = (data as Record<string, unknown[]>).year;
          processed[key] = new Array(yearArr?.length || 3).fill(0);
        } else {
          processed[key] = value.map((item) =>
            item === null || item === undefined || item === 'null' ? 0 : item
          );
        }
      } else {
        processed[key] = value === 'null' || value === null ? 0 : value;
      }
    }

    return processed;
  }
}
