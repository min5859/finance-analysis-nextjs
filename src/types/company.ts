/** 기업 재무 데이터 최상위 타입 (JSON 파일 구조와 1:1 대응) */
export interface CompanyFinancialData {
  company_name: string;
  company_code?: string;
  sector: string;
  report_year?: string;
  performance_data: PerformanceData;
  balance_sheet_data: BalanceSheetData;
  stability_data: StabilityData;
  cash_flow_data: CashFlowData;
  working_capital_data: WorkingCapitalData;
  profitability_data: ProfitabilityData;
  growth_rates: GrowthRatesData;
  dupont_data: DupontData;
  radar_data: RadarData;
  insights: Insights;
  conclusion: Conclusion;
}

/** 손익 데이터 (억원) */
export interface PerformanceData {
  year: string[];
  매출액: number[];
  영업이익: number[];
  순이익: number[];
  영업이익률: number[];
  순이익률: number[];
}

/** 재무상태표 (억원) */
export interface BalanceSheetData {
  year: string[];
  총자산: number[];
  총부채: number[];
  자본총계: number[];
}

/** 안정성 지표 */
export interface StabilityData {
  year: string[];
  부채비율: number[];
  유동비율: number[];
  이자보상배율: number[];
}

/** 현금흐름 (억원) */
export interface CashFlowData {
  year: string[];
  영업활동: number[];
  투자활동: number[];
  재무활동?: number[];
  FCF: number[];
}

/** 운전자본 효율성 (일) */
export interface WorkingCapitalData {
  year: string[];
  DSO: number[];
  DIO: number[];
  DPO: number[];
  CCC: number[];
}

/** 수익성 지표 (%) */
export interface ProfitabilityData {
  year: string[];
  ROE: number[];
  ROA: number[];
  영업이익률: number[];
  순이익률: number[];
}

/** 성장률 (%) */
export interface GrowthRatesData {
  year: string[];
  총자산성장률: number[];
  매출액성장률: number[];
  순이익성장률: number[];
}

/** 듀폰 분석 */
export interface DupontData {
  year: string[];
  순이익률: number[];
  자산회전율: number[];
  재무레버리지: number[];
  ROE: number[];
}

/** 레이더 차트 데이터 */
export interface RadarData {
  metric: string[];
  [key: string]: number[] | string[];
}

/** 인사이트 */
export interface Insights {
  balance_sheet: InsightSection;
  growth_rates: InsightSection;
  profitability: InsightSection;
  stability: StabilityInsight;
  cash_flow: InsightSection;
  cash_flow_causes?: InsightSection;
  cash_flow_diagnosis?: InsightSection;
  working_capital: WorkingCapitalInsight;
  income_statement: IncomeStatementInsight;
}

export interface InsightSection {
  title: string;
  content1: string;
  content2: string;
}

export interface StabilityInsight extends InsightSection {
  thresholds: {
    debt_ratio: ThresholdLevels;
    current_ratio: ThresholdLevels;
    interest_coverage: ThresholdLevels;
  };
}

export interface ThresholdLevels {
  very_safe?: number;
  very_good?: number;
  safe?: number;
  good?: number;
  normal?: number;
  fair?: number;
  caution: number;
  moderate?: number;
}

export interface WorkingCapitalInsight extends InsightSection {
  industry_avg_ccc: number;
  ccc_thresholds: ThresholdLevels;
}

export interface IncomeStatementInsight extends InsightSection {
  summary_message: string;
}

/** 결론 */
export interface Conclusion {
  strengths: Array<{ title: string; description: string }>;
  weaknesses: Array<{ title: string; description: string }>;
  strategic_recommendations: Array<{
    title: string;
    items: string[];
  }>;
}

/** 기업 목록 항목 */
export interface CompanyListItem {
  filename: string;
  name: string;
  sector: string;
}
