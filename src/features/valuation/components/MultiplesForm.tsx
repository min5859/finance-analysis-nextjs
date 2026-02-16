'use client';

import { useState } from 'react';
import type { PerformanceData, BalanceSheetData, CashFlowData } from '@/types/company';
import type { MultiplesParams, ValuationResult } from '../types';
import { calculateMultiples } from '../calculators/multiples';
import ParamGroup from '@/components/ui/ParamGroup';
import NumberInput from '@/components/ui/NumberInput';
import RangeInput from '@/components/ui/RangeInput';
import SubmitButton from '@/components/ui/SubmitButton';

interface MultiplesFormProps {
  perfData: PerformanceData;
  bsData: BalanceSheetData;
  cfData: CashFlowData;
  onSubmit: (r: ValuationResult) => void;
}

const ALL_MULTIPLES = ['PER', 'PBR', 'PSR', 'EV/EBITDA', 'EV/Sales', 'P/FCF'];

export default function MultiplesForm({ perfData, bsData, cfData, onSubmit }: MultiplesFormProps) {
  const [p, setP] = useState<MultiplesParams>({
    selectedMultiples: ['PER', 'PBR', 'EV/EBITDA'],
    industryMultiples: { PER: 12, PBR: 1.5, PSR: 1, 'EV/EBITDA': 8, 'EV/Sales': 2, 'P/FCF': 15 },
    discountPremium: 0,
    multipleWeights: { PER: 34, PBR: 33, 'EV/EBITDA': 33 },
  });

  const toggleMultiple = (m: string) => {
    setP((prev) => {
      const selected = prev.selectedMultiples.includes(m)
        ? prev.selectedMultiples.filter((x) => x !== m)
        : [...prev.selectedMultiples, m];
      if (selected.length === 0) return prev;
      const w = Math.floor(100 / selected.length);
      const weights: Record<string, number> = {};
      selected.forEach((s, i) => { weights[s] = i === selected.length - 1 ? 100 - w * (selected.length - 1) : w; });
      return { ...prev, selectedMultiples: selected, multipleWeights: weights };
    });
  };

  const calculate = () => {
    onSubmit(calculateMultiples(p, perfData, bsData, cfData));
  };

  return (
    <div className="space-y-4">
      <ParamGroup title="상대가치 배수 선택">
        <div className="flex flex-wrap gap-2">
          {ALL_MULTIPLES.map((m) => (
            <button
              key={m}
              onClick={() => toggleMultiple(m)}
              className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                p.selectedMultiples.includes(m)
                  ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
                  : 'bg-white border-gray-300 text-gray-500'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </ParamGroup>

      <ParamGroup title="산업 평균 배수 입력">
        <div className="grid grid-cols-3 gap-4">
          {p.selectedMultiples.map((m) => (
            <NumberInput
              key={m}
              label={`산업 평균 ${m}`}
              value={p.industryMultiples[m] || 0}
              step={0.5}
              onChange={(v) => setP((prev) => ({ ...prev, industryMultiples: { ...prev.industryMultiples, [m]: v } }))}
            />
          ))}
        </div>
      </ParamGroup>

      <ParamGroup title="할인/할증률 및 가중치">
        <RangeInput label="할인/할증률 (%)" value={p.discountPremium} min={-50} max={50} step={5} onChange={(v) => setP((prev) => ({ ...prev, discountPremium: v }))} />
        <div className="grid grid-cols-3 gap-4 mt-3">
          {p.selectedMultiples.map((m) => (
            <RangeInput
              key={m}
              label={`${m} 가중치 (%)`}
              value={p.multipleWeights[m] || 0}
              min={0}
              max={100}
              step={5}
              onChange={(v) => setP((prev) => ({ ...prev, multipleWeights: { ...prev.multipleWeights, [m]: v } }))}
            />
          ))}
        </div>
      </ParamGroup>

      <SubmitButton onClick={calculate} />
    </div>
  );
}
