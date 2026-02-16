'use client';

import { useState } from 'react';
import SlideHeader from '@/components/ui/SlideHeader';
import EmptyState from '@/components/ui/EmptyState';
import { useFinancialData } from '@/hooks/useFinancialData';
import type { Method, ValuationResult } from '@/features/valuation/types';
import DCFForm from '@/features/valuation/components/DCFForm';
import MultiplesForm from '@/features/valuation/components/MultiplesForm';
import AssetForm from '@/features/valuation/components/AssetForm';
import CombinedForm from '@/features/valuation/components/CombinedForm';
import ResultsView from '@/features/valuation/components/ResultsView';

const METHOD_OPTIONS: { key: Method; label: string }[] = [
  { key: 'dcf', label: 'DCF (Discounted Cash Flow)' },
  { key: 'multiples', label: '상대가치법 (Multiples)' },
  { key: 'asset', label: '자산가치법 (Asset-based)' },
  { key: 'combined', label: '복합 가치평가법' },
];

export default function ValuationManualPage() {
  const { dl } = useFinancialData();
  const [method, setMethod] = useState<Method>('dcf');
  const [result, setResult] = useState<ValuationResult | null>(null);

  if (!dl) return <EmptyState />;

  const perfData = dl.getPerformanceData();
  const bsData = dl.getBalanceSheetData();
  const cfData = dl.getCashFlowData();
  const growthData = dl.getGrowthRates();
  const companyName = dl.getCompanyName();

  return (
    <div>
      <SlideHeader title="가치 평가 (수동 검증)" />

      <div className="grid grid-cols-4 gap-2 mb-6">
        {METHOD_OPTIONS.map((m) => (
          <button
            key={m.key}
            onClick={() => { setMethod(m.key); setResult(null); }}
            className={`py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
              method === m.key
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        {companyName} 가치평가 - {METHOD_OPTIONS.find((m) => m.key === method)?.label}
      </h2>

      {!result ? (
        <>
          {method === 'dcf' && <DCFForm perfData={perfData} bsData={bsData} cfData={cfData} growthData={growthData} onSubmit={setResult} />}
          {method === 'multiples' && <MultiplesForm perfData={perfData} bsData={bsData} cfData={cfData} onSubmit={setResult} />}
          {method === 'asset' && <AssetForm bsData={bsData} onSubmit={setResult} />}
          {method === 'combined' && <CombinedForm perfData={perfData} bsData={bsData} cfData={cfData} onSubmit={setResult} />}
        </>
      ) : (
        <ResultsView result={result} onReset={() => setResult(null)} />
      )}
    </div>
  );
}
