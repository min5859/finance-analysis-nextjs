import type { ValuationResult } from '../types';
import { formatBillion, formatPercent } from '@/lib/format';
import BarChart from '@/components/charts/BarChart';

interface ResultsViewProps {
  result: ValuationResult;
  onReset: () => void;
}

export default function ResultsView({ result, onReset }: ResultsViewProps) {
  const details = result.details as Record<string, unknown>;
  const methods = details?.methods as Array<{ method: string; value: number }> | undefined;
  const fcfs = details?.fcfs as number[] | undefined;

  const chartLabels: string[] | null = methods
    ? methods.map((m) => m.method)
    : fcfs
    ? fcfs.map((_: number, i: number) => `${i + 1}년차`)
    : null;

  const chartDatasets: { label: string; data: number[]; color?: string }[] | null = methods
    ? [{ label: '평가 가치 (억원)', data: methods.map((m) => m.value) }]
    : fcfs
    ? [{ label: '예상 FCF (억원)', data: fcfs }]
    : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {result.enterprise_value != null && (
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-5 text-white">
            <p className="text-sm opacity-80">기업가치 (EV)</p>
            <p className="text-3xl font-bold mt-1">{formatBillion(result.enterprise_value)}억원</p>
          </div>
        )}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">주주가치 (Equity Value)</p>
          <p className="text-3xl font-bold mt-1">{formatBillion(result.equity_value)}억원</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-3">상세 내역 ({result.method})</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(details || {}).map(([key, val]) => {
            if (typeof val === 'object') return null;
            return (
              <div key={key} className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">{key}</span>
                <span className="font-medium">{typeof val === 'number' ? (key.includes('pct') || key.includes('rate') || key.includes('wacc') ? formatPercent(val) : formatBillion(val)) : String(val)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {chartLabels && chartDatasets && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <BarChart labels={chartLabels} datasets={chartDatasets} height={250} />
        </div>
      )}

      {result.sensitivity?.wacc && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">WACC 민감도 분석</h3>
          <div className="flex gap-2">
            {Object.entries(result.sensitivity.wacc).map(([wacc, val]) => (
              <div key={wacc} className="flex-1 text-center bg-gray-50 rounded p-2">
                <p className="text-xs text-gray-500">WACC {wacc}</p>
                <p className="font-semibold text-sm">{formatBillion(val)}억원</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
      >
        파라미터 재설정
      </button>
    </div>
  );
}
