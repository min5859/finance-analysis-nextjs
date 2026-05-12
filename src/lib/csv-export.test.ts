import { describe, it, expect } from 'vitest';
import { buildCompanyCsv } from './csv-export';
import type { CompanyFinancialData } from '@/types/company';

function makeFixture(): CompanyFinancialData {
  return {
    company_name: '테스트, 주식회사',
    company_code: '001234',
    sector: 'IT',
    report_year: '2023',
    performance_data: {
      year: ['2021', '2022', '2023'],
      매출액: [100, 120, 150],
      영업이익: [10, 15, 20],
      순이익: [8, 12, 16],
      영업이익률: [10, 12.5, 13.3],
      순이익률: [8, 10, 10.7],
    },
    balance_sheet_data: {
      year: ['2021', '2022', '2023'],
      총자산: [500, 600, 700],
      총부채: [200, 240, 280],
      자본총계: [300, 360, 420],
    },
    stability_data: { year: [], 부채비율: [], 유동비율: [], 이자보상배율: [] },
    cash_flow_data: { year: [], 영업활동: [], 투자활동: [], FCF: [] },
    working_capital_data: { year: [], DSO: [], DIO: [], DPO: [], CCC: [] },
    profitability_data: { year: [], ROE: [], ROA: [], 영업이익률: [], 순이익률: [] },
    growth_rates: { year: [], 총자산성장률: [], 매출액성장률: [], 순이익성장률: [] },
    dupont_data: { year: [], 순이익률: [], 자산회전율: [], 재무레버리지: [], ROE: [] },
    radar_data: { metric: [] },
    insights: {} as CompanyFinancialData['insights'],
    conclusion: {} as CompanyFinancialData['conclusion'],
  };
}

describe('buildCompanyCsv', () => {
  it('escapes commas inside text fields with quotes', () => {
    const csv = buildCompanyCsv(makeFixture());
    expect(csv).toContain('"테스트, 주식회사"');
  });

  it('skips time-series sections that have an empty year axis', () => {
    const csv = buildCompanyCsv(makeFixture());
    expect(csv).toContain('손익 데이터 (억원)');
    expect(csv).toContain('재무상태표 (억원)');
    expect(csv).not.toContain('안정성 지표');
  });

  it('writes each metric row aligned to the year header', () => {
    const csv = buildCompanyCsv(makeFixture());
    const lines = csv.split('\r\n');
    const header = lines.find((l) => l.startsWith('지표,'));
    const row = lines.find((l) => l.startsWith('매출액,'));
    expect(header).toBe('지표,2021,2022,2023');
    expect(row).toBe('매출액,100,120,150');
  });
});
