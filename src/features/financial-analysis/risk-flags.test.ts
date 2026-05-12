import { describe, it, expect } from 'vitest';
import { detectRiskFlags } from './risk-flags';
import type { CompanyFinancialData } from '@/types/company';

function base(): CompanyFinancialData {
  return {
    company_name: 't',
    sector: 't',
    performance_data: {
      year: ['2021', '2022', '2023'],
      매출액: [100, 110, 120],
      영업이익: [10, 12, 15],
      순이익: [8, 10, 12],
      영업이익률: [10, 10.9, 12.5],
      순이익률: [8, 9, 10],
    },
    balance_sheet_data: { year: ['2021', '2022', '2023'], 총자산: [500, 550, 600], 총부채: [200, 220, 240], 자본총계: [300, 330, 360] },
    stability_data: { year: ['2021', '2022', '2023'], 부채비율: [80, 75, 70], 유동비율: [120, 130, 140], 이자보상배율: [5, 6, 7] },
    cash_flow_data: { year: ['2021', '2022', '2023'], 영업활동: [15, 18, 22], 투자활동: [-5, -6, -7], 재무활동: [-2, -3, -3], FCF: [10, 12, 15] },
    working_capital_data: { year: ['2021', '2022', '2023'], DSO: [30, 32, 33], DIO: [20, 22, 24], DPO: [40, 42, 45], CCC: [10, 12, 12] },
    profitability_data: { year: ['2021', '2022', '2023'], ROE: [10, 11, 12], ROA: [4, 4.5, 5], 영업이익률: [10, 10.9, 12.5], 순이익률: [8, 9, 10] },
    growth_rates: { year: [], 총자산성장률: [], 매출액성장률: [], 순이익성장률: [] },
    dupont_data: { year: [], 순이익률: [], 자산회전율: [], 재무레버리지: [], ROE: [] },
    radar_data: { metric: [] },
    insights: {} as CompanyFinancialData['insights'],
    conclusion: {} as CompanyFinancialData['conclusion'],
  };
}

describe('detectRiskFlags', () => {
  it('returns no flags for a clean company', () => {
    expect(detectRiskFlags(base())).toEqual([]);
  });

  it('flags op loss as critical', () => {
    const d = base();
    d.performance_data.영업이익 = [10, 5, -3];
    const flags = detectRiskFlags(d);
    const op = flags.find((f) => f.id === 'op-loss');
    expect(op?.severity).toBe('critical');
  });

  it('flags 2y revenue decline at higher severity than 1y', () => {
    const twoYearDecline = base();
    twoYearDecline.performance_data.매출액 = [150, 130, 110];
    const flagsTwo = detectRiskFlags(twoYearDecline);
    expect(flagsTwo.find((f) => f.id === 'revenue-decline-2y')?.severity).toBe('high');
    expect(flagsTwo.find((f) => f.id === 'revenue-decline')).toBeUndefined();

    const oneYearDecline = base();
    oneYearDecline.performance_data.매출액 = [100, 130, 110];
    const flagsOne = detectRiskFlags(oneYearDecline);
    expect(flagsOne.find((f) => f.id === 'revenue-decline')?.severity).toBe('medium');
  });

  it('flags negative equity as critical leverage', () => {
    const d = base();
    d.balance_sheet_data.자본총계 = [300, 100, -50];
    const flags = detectRiskFlags(d);
    expect(flags.find((f) => f.id === 'negative-equity')?.severity).toBe('critical');
  });

  it('sorts critical flags before high/medium', () => {
    const d = base();
    d.performance_data.영업이익 = [10, 5, -3]; // critical
    d.profitability_data.ROE = [25, 20, 8]; // high (-12pp)
    d.working_capital_data.CCC = [10, 12, 50]; // medium (+38)
    const flags = detectRiskFlags(d);
    expect(flags[0].severity).toBe('critical');
    const severities = flags.map((f) => f.severity);
    const firstHigh = severities.indexOf('high');
    const firstMedium = severities.indexOf('medium');
    if (firstHigh >= 0 && firstMedium >= 0) {
      expect(firstHigh).toBeLessThan(firstMedium);
    }
  });
});
