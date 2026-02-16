'use client';

import { useState } from 'react';
import type { PerformanceData, BalanceSheetData, CashFlowData } from '@/types/company';
import type { CombinedParams, ValuationResult } from '../types';
import { calculateCombined } from '../calculators/combined';
import { latest } from '@/lib/format';
import ParamGroup from '@/components/ui/ParamGroup';
import NumberInput from '@/components/ui/NumberInput';
import RangeInput from '@/components/ui/RangeInput';
import SubmitButton from '@/components/ui/SubmitButton';

interface CombinedFormProps {
  perfData: PerformanceData;
  bsData: BalanceSheetData;
  cfData: CashFlowData;
  onSubmit: (r: ValuationResult) => void;
}

export default function CombinedForm({ perfData, bsData, cfData, onSubmit }: CombinedFormProps) {
  const [p, setP] = useState<CombinedParams>({
    useDcf: true, useMultiples: true, useAsset: true,
    dcfWeight: 40, multiplesWeight: 35, assetWeight: 25,
    dcfWacc: 10, dcfTerminalGrowth: 2,
    dcfBaseFcf: latest(cfData?.FCF ?? [0]) || latest(perfData?.영업이익 ?? [0]) * 0.7 || 100,
    perMultiple: 12, pbrMultiple: 1.5, evEbitdaMultiple: 8, multiplesDiscount: 0,
    assetAdj: 10, liabilityAdj: 0,
  });

  const set = (key: keyof CombinedParams, val: number | boolean) => setP((prev) => ({ ...prev, [key]: val }));

  const calculate = () => {
    onSubmit(calculateCombined(p, perfData, bsData, cfData));
  };

  return (
    <div className="space-y-4">
      <ParamGroup title="가치평가 방법 선택 및 가중치">
        <div className="flex gap-4 mb-3">
          {['useDcf', 'useMultiples', 'useAsset'].map((key, i) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={p[key as keyof CombinedParams] as boolean} onChange={(e) => set(key as keyof CombinedParams, e.target.checked)} />
              {['DCF', '상대가치법', '자산가치법'][i]}
            </label>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {p.useDcf && <RangeInput label="DCF 가중치 (%)" value={p.dcfWeight} min={0} max={100} step={5} onChange={(v) => set('dcfWeight', v)} />}
          {p.useMultiples && <RangeInput label="상대가치법 가중치 (%)" value={p.multiplesWeight} min={0} max={100} step={5} onChange={(v) => set('multiplesWeight', v)} />}
          {p.useAsset && <RangeInput label="자산가치법 가중치 (%)" value={p.assetWeight} min={0} max={100} step={5} onChange={(v) => set('assetWeight', v)} />}
        </div>
      </ParamGroup>

      {p.useDcf && (
        <ParamGroup title="DCF 기본 파라미터">
          <div className="grid grid-cols-3 gap-4">
            <NumberInput label="WACC (%)" value={p.dcfWacc} step={0.5} onChange={(v) => set('dcfWacc', v)} />
            <NumberInput label="영구 성장률 (%)" value={p.dcfTerminalGrowth} step={0.1} onChange={(v) => set('dcfTerminalGrowth', v)} />
            <NumberInput label="FCF 기준값 (억원)" value={p.dcfBaseFcf} step={10} onChange={(v) => set('dcfBaseFcf', v)} />
          </div>
        </ParamGroup>
      )}

      {p.useMultiples && (
        <ParamGroup title="상대가치법 기본 파라미터">
          <div className="grid grid-cols-3 gap-4">
            <NumberInput label="PER 배수" value={p.perMultiple} step={0.5} onChange={(v) => set('perMultiple', v)} />
            <NumberInput label="PBR 배수" value={p.pbrMultiple} step={0.1} onChange={(v) => set('pbrMultiple', v)} />
            <NumberInput label="EV/EBITDA 배수" value={p.evEbitdaMultiple} step={0.5} onChange={(v) => set('evEbitdaMultiple', v)} />
          </div>
          <RangeInput label="할인/할증률 (%)" value={p.multiplesDiscount} min={-50} max={50} step={5} onChange={(v) => set('multiplesDiscount', v)} />
        </ParamGroup>
      )}

      {p.useAsset && (
        <ParamGroup title="자산가치법 기본 파라미터">
          <div className="grid grid-cols-2 gap-4">
            <RangeInput label="자산 가치 조정 (%)" value={p.assetAdj} min={-50} max={100} step={5} onChange={(v) => set('assetAdj', v)} />
            <RangeInput label="부채 가치 조정 (%)" value={p.liabilityAdj} min={-20} max={30} step={5} onChange={(v) => set('liabilityAdj', v)} />
          </div>
        </ParamGroup>
      )}

      <SubmitButton onClick={calculate} />
    </div>
  );
}
