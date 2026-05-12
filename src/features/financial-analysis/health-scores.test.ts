import { describe, it, expect } from 'vitest';
import { calculatePiotroskiFScore, detectDistressSignals } from './health-scores';
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
    cash_flow_data: { year: ['2021', '2022', '2023'], 영업활동: [15, 18, 22], 투자활동: [-5, -6, -7], FCF: [10, 12, 15] },
    working_capital_data: { year: [], DSO: [], DIO: [], DPO: [], CCC: [] },
    profitability_data: { year: ['2021', '2022', '2023'], ROE: [10, 11, 12], ROA: [4, 4.5, 5], 영업이익률: [10, 10.9, 12.5], 순이익률: [8, 9, 10] },
    growth_rates: { year: [], 총자산성장률: [], 매출액성장률: [], 순이익성장률: [] },
    dupont_data: { year: ['2021', '2022', '2023'], 순이익률: [8, 9, 10], 자산회전율: [0.7, 0.72, 0.75], 재무레버리지: [1.6, 1.6, 1.6], ROE: [10, 11, 12] },
    radar_data: { metric: [] },
    insights: {} as CompanyFinancialData['insights'],
    conclusion: {} as CompanyFinancialData['conclusion'],
  };
}

describe('calculatePiotroskiFScore', () => {
  it('hits all 8 checks for a uniformly improving company', () => {
    const r = calculatePiotroskiFScore(base());
    expect(r.score).toBe(8);
    expect(r.max).toBe(8);
    expect(r.grade).toBe('strong');
  });

  it('returns insufficient when too few series have a prior year', () => {
    const d = base();
    d.performance_data.year = ['2023'];
    d.performance_data.매출액 = [100];
    d.performance_data.영업이익률 = [10];
    d.performance_data.순이익 = [8];
    d.profitability_data.ROA = [4];
    d.cash_flow_data.영업활동 = [15];
    d.stability_data.부채비율 = [70];
    d.stability_data.유동비율 = [140];
    d.dupont_data.자산회전율 = [0.75];
    const r = calculatePiotroskiFScore(d);
    expect(r.grade).toBe('insufficient');
    expect(r.max).toBeLessThan(6);
  });
});

describe('detectDistressSignals', () => {
  it('marks healthy company as safe', () => {
    const r = detectDistressSignals(base());
    expect(r.level).toBe('safe');
  });

  it('flags negative op margin as danger', () => {
    const d = base();
    d.performance_data.영업이익률 = [-5, -3, -2];
    const r = detectDistressSignals(d);
    expect(r.level).toBe('danger');
    expect(r.signals.some((s) => s.label === '영업적자')).toBe(true);
  });

  it('flags interest coverage < 1 as danger (zombie firm)', () => {
    const d = base();
    d.stability_data.이자보상배율 = [0.5, 0.6, 0.8];
    const r = detectDistressSignals(d);
    expect(r.signals.some((s) => s.label === '한계기업 위험')).toBe(true);
  });
});
