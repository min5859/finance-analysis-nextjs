'use client';

import { useState } from 'react';
import type { BalanceSheetData } from '@/types/company';
import type { AssetParams, ValuationResult } from '../types';
import { calculateAsset } from '../calculators/asset';
import { formatBillion, latest } from '@/lib/format';
import ParamGroup from '@/components/ui/ParamGroup';
import NumberInput from '@/components/ui/NumberInput';
import RangeInput from '@/components/ui/RangeInput';
import InfoBox from '@/components/ui/InfoBox';
import SubmitButton from '@/components/ui/SubmitButton';

interface AssetFormProps {
  bsData: BalanceSheetData;
  onSubmit: (r: ValuationResult) => void;
}

export default function AssetForm({ bsData, onSubmit }: AssetFormProps) {
  const totalAssets = latest(bsData?.총자산 ?? [0]);
  const totalLiabilities = latest(bsData?.총부채 ?? [0]);
  const totalEquity = latest(bsData?.자본총계 ?? [0]);

  const [p, setP] = useState<AssetParams>({
    realEstatePercent: 30, realEstateAdj: 20,
    equipmentPercent: 20, equipmentAdj: -30,
    inventoryPercent: 15, inventoryAdj: -10,
    intangiblePercent: 10, intangibleAdj: 50,
    otherAdj: 0, liabilityAdj: 0,
    contingentLiability: 0, liquidationCostPercent: 10,
  });

  const set = (key: keyof AssetParams, val: number) => setP((prev) => ({ ...prev, [key]: val }));
  const otherPercent = 100 - p.realEstatePercent - p.equipmentPercent - p.inventoryPercent - p.intangiblePercent;

  const calculate = () => {
    onSubmit(calculateAsset(p, totalAssets, totalLiabilities));
  };

  return (
    <div className="space-y-4">
      <ParamGroup title="자산가치 조정">
        <InfoBox>
          총자산: <strong>{formatBillion(totalAssets)}억원</strong> | 총부채: <strong>{formatBillion(totalLiabilities)}억원</strong> | 자본총계: <strong>{formatBillion(totalEquity)}억원</strong>
        </InfoBox>
        <div className="grid grid-cols-2 gap-4">
          <RangeInput label="토지/건물 비중 (%)" value={p.realEstatePercent} min={0} max={70} step={5} onChange={(v) => set('realEstatePercent', v)} />
          <RangeInput label="토지/건물 조정 (%)" value={p.realEstateAdj} min={-50} max={100} step={5} onChange={(v) => set('realEstateAdj', v)} />
          <RangeInput label="설비 비중 (%)" value={p.equipmentPercent} min={0} max={70} step={5} onChange={(v) => set('equipmentPercent', v)} />
          <RangeInput label="설비 조정 (%)" value={p.equipmentAdj} min={-80} max={50} step={5} onChange={(v) => set('equipmentAdj', v)} />
          <RangeInput label="재고자산 비중 (%)" value={p.inventoryPercent} min={0} max={50} step={5} onChange={(v) => set('inventoryPercent', v)} />
          <RangeInput label="재고자산 조정 (%)" value={p.inventoryAdj} min={-50} max={30} step={5} onChange={(v) => set('inventoryAdj', v)} />
          <RangeInput label="무형자산 비중 (%)" value={p.intangiblePercent} min={0} max={50} step={5} onChange={(v) => set('intangiblePercent', v)} />
          <RangeInput label="무형자산 조정 (%)" value={p.intangibleAdj} min={-80} max={200} step={10} onChange={(v) => set('intangibleAdj', v)} />
        </div>
        <InfoBox>기타 자산 비중: <strong>{otherPercent}%</strong></InfoBox>
        <RangeInput label="기타 자산 조정 (%)" value={p.otherAdj} min={-50} max={50} step={5} onChange={(v) => set('otherAdj', v)} />
      </ParamGroup>

      <ParamGroup title="부채 가치 조정">
        <RangeInput label="부채 가치 조정 (%)" value={p.liabilityAdj} min={-20} max={30} step={5} onChange={(v) => set('liabilityAdj', v)} />
        <NumberInput label="우발채무 추가 (억원)" value={p.contingentLiability} step={10} onChange={(v) => set('contingentLiability', v)} />
      </ParamGroup>

      <ParamGroup title="청산 비용 설정">
        <RangeInput label="청산 비용 (자산 대비 %)" value={p.liquidationCostPercent} min={0} max={30} step={1} onChange={(v) => set('liquidationCostPercent', v)} />
      </ParamGroup>

      <SubmitButton onClick={calculate} />
    </div>
  );
}
