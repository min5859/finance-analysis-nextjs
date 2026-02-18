'use client';
import { useState } from 'react';
import { useCompanyStore } from '@/store/company-store';
import { useFinancialData } from '@/hooks/useFinancialData';
import EmptyState from '@/components/ui/EmptyState';
import { COLOR_PALETTE } from '@/components/charts/chartConfig';
import SlideHeader from '@/components/ui/SlideHeader';
import MetricCard from '@/components/ui/MetricCard';
import ChartCard from '@/components/charts/ChartCard';
import BarChart from '@/components/charts/BarChart';

export default function ValuationPage() {
  const { aiProvider, valuationResult, setValuationResult, isValuating, setIsValuating } = useCompanyStore();
  const { dl } = useFinancialData();
  const [error, setError] = useState<string | null>(null);

  if (!dl) return <EmptyState />;
  const perf = dl.getPerformanceData();
  const bs = dl.getBalanceSheetData();
  const cf = dl.getCashFlowData();

  const handleAnalyze = async () => {
    setIsValuating(true); setError(null);
    try {
      const res = await fetch('/api/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_info: { corp_name: dl.getCompanyName(), sector: dl.getSector() },
          financial_data: {
            years: perf.year,
            assets: bs.총자산, liabilities: bs.총부채, equity: bs.자본총계,
            revenue: perf.매출액, operating_profit: perf.영업이익, net_income: perf.순이익,
            fcf: cf.FCF,
          },
          provider: aiProvider,
        }),
      });
      const result = await res.json();
      if (result.success) { setValuationResult(result.data); }
      else { setError(result.error || '분석 실패'); }
    } catch (err) { setError(String(err)); }
    finally { setIsValuating(false); }
  };

  const downloadJson = () => {
    if (!valuationResult) return;
    const blob = new Blob([JSON.stringify(valuationResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dl.getCompanyName()}_valuation.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const v = valuationResult;

  return (
    <div>
      <SlideHeader title="AI 기업 가치 평가" />
      {!v && (
        <div className="text-center py-8">
          <div className="grid grid-cols-3 gap-4 mb-8 text-left">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-indigo-600 mb-1">EBITDA 방법</h3>
              <p className="text-xs text-gray-500">기업의 EBITDA에 업종 배수를 적용하여 기업가치를 산출합니다.</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-indigo-600 mb-1">DCF 방법</h3>
              <p className="text-xs text-gray-500">미래 현금흐름을 할인하여 현재가치로 기업가치를 산출합니다.</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-indigo-600 mb-1">시나리오 분석</h3>
              <p className="text-xs text-gray-500">보수적/기본/낙관적 3가지 시나리오로 기업가치 범위를 제시합니다.</p>
            </div>
          </div>
          <button onClick={handleAnalyze} disabled={isValuating} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {isValuating ? '분석 중...' : 'AI 기업 가치 평가 시작'}
          </button>
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>
      )}
      {v && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <MetricCard title="EBITDA 평균" value={Math.round((v.ebitda_valuation.conservative + v.ebitda_valuation.base + v.ebitda_valuation.optimistic) / 3)} unit="억원" />
            <MetricCard title="DCF 평균" value={Math.round((v.dcf_valuation.conservative + v.dcf_valuation.base + v.dcf_valuation.optimistic) / 3)} unit="억원" />
            <MetricCard title="종합 평균" value={Math.round(((v.ebitda_valuation.conservative + v.ebitda_valuation.base + v.ebitda_valuation.optimistic) / 3 + (v.dcf_valuation.conservative + v.dcf_valuation.base + v.dcf_valuation.optimistic) / 3) / 2)} unit="억원" />
          </div>
          <ChartCard title="시나리오별 기업가치 (억원)">
            <BarChart horizontal datalabelFormatter={(v) => v.toLocaleString('ko-KR')} labels={['보수적', '기본', '낙관적']} datasets={[
              { label: 'EBITDA', data: [v.ebitda_valuation.conservative, v.ebitda_valuation.base, v.ebitda_valuation.optimistic], color: COLOR_PALETTE.primary },
              { label: 'DCF', data: [v.dcf_valuation.conservative, v.dcf_valuation.base, v.dcf_valuation.optimistic], color: COLOR_PALETTE.success },
            ]} />
          </ChartCard>

          {/* Assumptions */}
          {v.assumptions && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 my-4">
              <h3 className="font-semibold text-gray-800 mb-3">가정 (Assumptions)</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="text-gray-500 mb-1">EBITDA 배수</h4>
                  <p>보수적: {v.assumptions.ebitda_multipliers?.conservative}x | 기본: {v.assumptions.ebitda_multipliers?.base}x | 낙관적: {v.assumptions.ebitda_multipliers?.optimistic}x</p>
                </div>
                <div>
                  <h4 className="text-gray-500 mb-1">할인율</h4>
                  <p>보수적: {v.assumptions.discount_rates?.conservative}% | 기본: {v.assumptions.discount_rates?.base}% | 낙관적: {v.assumptions.discount_rates?.optimistic}%</p>
                </div>
                <div>
                  <h4 className="text-gray-500 mb-1">성장률</h4>
                  <p>보수적: {v.assumptions.growth_rates?.conservative}% | 기본: {v.assumptions.growth_rates?.base}% | 낙관적: {v.assumptions.growth_rates?.optimistic}%</p>
                </div>
                <div>
                  <h4 className="text-gray-500 mb-1">영구 성장률</h4>
                  <p>보수적: {v.assumptions.terminal_growth_rates?.conservative}% | 기본: {v.assumptions.terminal_growth_rates?.base}% | 낙관적: {v.assumptions.terminal_growth_rates?.optimistic}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Calculation descriptions */}
          {v.calculations && (
            <div className="grid grid-cols-2 gap-4 my-4">
              {v.calculations.ebitda_description && (
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h4 className="font-semibold text-indigo-700 text-sm mb-1">EBITDA 산출 근거</h4>
                  <p className="text-xs text-gray-700">{v.calculations.ebitda_description}</p>
                </div>
              )}
              {v.calculations.dcf_description && (
                <div className="bg-emerald-50 rounded-lg p-4">
                  <h4 className="font-semibold text-emerald-700 text-sm mb-1">DCF 산출 근거</h4>
                  <p className="text-xs text-gray-700">{v.calculations.dcf_description}</p>
                </div>
              )}
            </div>
          )}

          {v.summary && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 my-4">
              <h3 className="font-semibold text-gray-800 mb-2">종합 분석</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{v.summary}</p>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button onClick={() => setValuationResult(null)} className="text-sm text-gray-500 hover:text-gray-700">다시 분석하기</button>
            <button onClick={downloadJson} className="text-sm text-indigo-600 hover:text-indigo-800">JSON 다운로드</button>
          </div>
        </>
      )}
    </div>
  );
}
