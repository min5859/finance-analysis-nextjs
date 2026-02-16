import type { ComponentType } from 'react';
import SummaryPage from '@/app/(dashboard)/summary/page';
import IncomeStatementPage from '@/app/(dashboard)/income-statement/page';
import BalanceSheetPage from '@/app/(dashboard)/balance-sheet/page';
import GrowthRatePage from '@/app/(dashboard)/growth-rate/page';
import ProfitabilityPage from '@/app/(dashboard)/profitability/page';
import StabilityPage from '@/app/(dashboard)/stability/page';
import CashFlowPage from '@/app/(dashboard)/cash-flow/page';
import WorkingCapitalPage from '@/app/(dashboard)/working-capital/page';
import IndustryComparisonPage from '@/app/(dashboard)/industry-comparison/page';
import ConclusionPage from '@/app/(dashboard)/conclusion/page';
import ValuationPage from '@/app/(dashboard)/valuation/page';
import ValuationManualPage from '@/app/(dashboard)/valuation-manual/page';

export interface SlideConfig {
  id: string;
  label: string;
  Component: ComponentType;
}

// 리포트 슬라이드 — 여기만 수정하면 Sidebar + 전체 리포트 자동 반영
export const reportSlides: SlideConfig[] = [
  { id: 'summary', label: '요약', Component: SummaryPage },
  { id: 'income-statement', label: '손익계산서', Component: IncomeStatementPage },
  { id: 'balance-sheet', label: '재무상태표', Component: BalanceSheetPage },
  { id: 'growth-rate', label: '성장성 분석', Component: GrowthRatePage },
  { id: 'profitability', label: '수익성 분석', Component: ProfitabilityPage },
  { id: 'stability', label: '안정성 분석', Component: StabilityPage },
  { id: 'cash-flow', label: '현금흐름표', Component: CashFlowPage },
  { id: 'working-capital', label: '운전자본 분석', Component: WorkingCapitalPage },
  { id: 'industry-comparison', label: '업계비교 현황', Component: IndustryComparisonPage },
  { id: 'conclusion', label: '종합 결론', Component: ConclusionPage },
  { id: 'valuation', label: '가치 평가', Component: ValuationPage },
  { id: 'valuation-manual', label: '가치 평가(검증)', Component: ValuationManualPage },
];

// 네비게이션 전용 (리포트 미포함)
export const navOnlyItems = [
  { href: '/', label: '재무제표 분석 시작' },
  { href: '/dart', label: 'DART 재무제표 데이터' },
];
