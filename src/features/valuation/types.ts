import type { PerformanceData, BalanceSheetData, CashFlowData, GrowthRatesData } from '@/types/company';

export type Method = 'dcf' | 'multiples' | 'asset' | 'combined';

export interface DCFParams {
  forecastPeriod: number;
  riskFreeRate: number;
  marketRiskPremium: number;
  beta: number;
  costOfDebt: number;
  taxRate: number;
  debtWeight: number;
  customWacc: number | null;
  initialGrowthRate: number;
  terminalGrowthRate: number;
  growthYears: number;
  growthDecay: boolean;
  baseFcf: number;
  fcfAdjustment: number;
}

export interface MultiplesParams {
  selectedMultiples: string[];
  industryMultiples: Record<string, number>;
  discountPremium: number;
  multipleWeights: Record<string, number>;
}

export interface AssetParams {
  realEstatePercent: number;
  realEstateAdj: number;
  equipmentPercent: number;
  equipmentAdj: number;
  inventoryPercent: number;
  inventoryAdj: number;
  intangiblePercent: number;
  intangibleAdj: number;
  otherAdj: number;
  liabilityAdj: number;
  contingentLiability: number;
  liquidationCostPercent: number;
}

export interface CombinedParams {
  useDcf: boolean;
  useMultiples: boolean;
  useAsset: boolean;
  dcfWeight: number;
  multiplesWeight: number;
  assetWeight: number;
  dcfWacc: number;
  dcfTerminalGrowth: number;
  dcfBaseFcf: number;
  perMultiple: number;
  pbrMultiple: number;
  evEbitdaMultiple: number;
  multiplesDiscount: number;
  assetAdj: number;
  liabilityAdj: number;
}

export interface ValuationResult {
  method: string;
  equity_value: number;
  enterprise_value?: number;
  details: Record<string, unknown>;
  sensitivity?: Record<string, Record<string, number>>;
}

export interface FinancialDataProps {
  perfData: PerformanceData;
  bsData: BalanceSheetData;
  cfData: CashFlowData;
  growthData: GrowthRatesData;
}
