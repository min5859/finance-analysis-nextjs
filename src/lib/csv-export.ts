import type { CompanyFinancialData } from '@/types/company';

type NumericSeries = Record<string, number[]>;

function escapeCsv(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

/**
 * 시계열 섹션 1개를 CSV 행 배열로 변환.
 *
 * 입력 예: { year: ['2021','2022','2023'], 매출액: [100, 120, 130], ... }
 * 출력: [['지표', '2021', '2022', '2023'], ['매출액', '100', '120', '130'], ...]
 *
 * year 필드를 헤더 행으로 쓰고, 나머지 number[] 키 각각이 한 행.
 */
function timeSeriesSection(title: string, data: Record<string, unknown>): string[][] {
  const year = (data?.year as string[]) ?? [];
  if (year.length === 0) return [];

  const rows: string[][] = [];
  rows.push([title]);
  rows.push(['지표', ...year]);

  const numericKeys = Object.keys(data).filter(
    (k) => k !== 'year' && Array.isArray(data[k]) && typeof (data[k] as unknown[])[0] === 'number',
  );

  for (const key of numericKeys) {
    const arr = (data as NumericSeries)[key];
    const values = year.map((_, i) => {
      const v = arr[i];
      return v === undefined || v === null ? '' : String(v);
    });
    rows.push([key, ...values]);
  }

  return rows;
}

export function buildCompanyCsv(data: CompanyFinancialData): string {
  const asRecord = (v: unknown) => (v ?? {}) as Record<string, unknown>;

  const sections: string[][][] = [
    [
      ['회사 정보'],
      ['회사명', data.company_name ?? ''],
      ['업종', data.sector ?? ''],
      ['보고 연도', data.report_year ?? ''],
      ['회사 코드', data.company_code ?? ''],
    ],
    timeSeriesSection('손익 데이터 (억원)', asRecord(data.performance_data)),
    timeSeriesSection('재무상태표 (억원)', asRecord(data.balance_sheet_data)),
    timeSeriesSection('안정성 지표', asRecord(data.stability_data)),
    timeSeriesSection('현금흐름 (억원)', asRecord(data.cash_flow_data)),
    timeSeriesSection('운전자본 효율성 (일)', asRecord(data.working_capital_data)),
    timeSeriesSection('수익성 지표 (%)', asRecord(data.profitability_data)),
    timeSeriesSection('성장률 (%)', asRecord(data.growth_rates)),
    timeSeriesSection('듀폰 분해', asRecord(data.dupont_data)),
  ].filter((s) => s.length > 0);

  const lines: string[] = [];
  for (const section of sections) {
    for (const row of section) lines.push(row.map(escapeCsv).join(','));
    lines.push('');
  }

  return lines.join('\r\n');
}

export function downloadCompanyCsv(data: CompanyFinancialData): void {
  const csv = buildCompanyCsv(data);
  // Excel UTF-8 호환을 위한 BOM
  const bom = '﻿';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  a.href = url;
  a.download = `${data.company_name || 'company'}_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
