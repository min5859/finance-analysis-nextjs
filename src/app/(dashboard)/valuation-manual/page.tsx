'use client';

import { useState, useMemo } from 'react';
import SlideHeader from '@/components/ui/SlideHeader';
import { useCompanyStore } from '@/store/company-store';
import { DataLoader } from '@/lib/data-loader';
import { formatBillion, formatPercent, latest } from '@/lib/format';
import BarChart from '@/components/charts/BarChart';

type Method = 'dcf' | 'multiples' | 'asset' | 'combined';

interface DCFParams {
  forecastPeriod: number;
  riskFreeRate: number;
  marketRiskPremium: number;
  beta: number;
  costOfDebt: number;
  taxRate: number;
  debtWeight: number;
  customWacc: number | null;
  initialGrowthRate: number;
  terminalGrowthRate: number;
  growthYears: number;
  growthDecay: boolean;
  baseFcf: number;
  fcfAdjustment: number;
}

interface MultiplesParams {
  selectedMultiples: string[];
  industryMultiples: Record<string, number>;
  discountPremium: number;
  multipleWeights: Record<string, number>;
}

interface AssetParams {
  realEstatePercent: number;
  realEstateAdj: number;
  equipmentPercent: number;
  equipmentAdj: number;
  inventoryPercent: number;
  inventoryAdj: number;
  intangiblePercent: number;
  intangibleAdj: number;
  otherAdj: number;
  liabilityAdj: number;
  contingentLiability: number;
  liquidationCostPercent: number;
}

interface CombinedParams {
  useDcf: boolean;
  useMultiples: boolean;
  useAsset: boolean;
  dcfWeight: number;
  multiplesWeight: number;
  assetWeight: number;
  dcfWacc: number;
  dcfTerminalGrowth: number;
  dcfBaseFcf: number;
  perMultiple: number;
  pbrMultiple: number;
  evEbitdaMultiple: number;
  multiplesDiscount: number;
  assetAdj: number;
  liabilityAdj: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ValuationResult = Record<string, any>;

const METHOD_OPTIONS: { key: Method; label: string }[] = [
  { key: 'dcf', label: 'DCF (Discounted Cash Flow)' },
  { key: 'multiples', label: '상대가치법 (Multiples)' },
  { key: 'asset', label: '자산가치법 (Asset-based)' },
  { key: 'combined', label: '복합 가치평가법' },
];

export default function ValuationManualPage() {
  const companyData = useCompanyStore((s) => s.companyData);
  const [method, setMethod] = useState<Method>('dcf');
  const [result, setResult] = useState<ValuationResult | null>(null);

  if (!companyData) {
    return <p className="text-gray-500 text-center py-12">기업 데이터를 먼저 로드해주세요.</p>;
  }

  const loader = new DataLoader(companyData);
  const companyName = loader.getCompanyName();
  const perfData = loader.getPerformanceData();
  const bsData = loader.getBalanceSheetData();
  const cfData = loader.getCashFlowData();
  const growthData = loader.getGrowthRates();

  return (
    <div>
      <SlideHeader title="가치 평가 (수동 검증)" />

      {/* Method Selector */}
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
          {method === 'dcf' && (
            <DCFForm perfData={perfData} bsData={bsData} cfData={cfData} growthData={growthData} onSubmit={setResult} />
          )}
          {method === 'multiples' && (
            <MultiplesForm perfData={perfData} bsData={bsData} cfData={cfData} onSubmit={setResult} />
          )}
          {method === 'asset' && (
            <AssetForm bsData={bsData} onSubmit={setResult} />
          )}
          {method === 'combined' && (
            <CombinedForm perfData={perfData} bsData={bsData} cfData={cfData} onSubmit={setResult} />
          )}
        </>
      ) : (
        <ResultsView result={result} onReset={() => setResult(null)} />
      )}
    </div>
  );
}

/* ────── DCF Form ────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DCFForm({ perfData, bsData, cfData, growthData, onSubmit }: { perfData: any; bsData: any; cfData: any; growthData: any; onSubmit: (r: ValuationResult) => void }) {
  const latestDebt = latest(bsData?.총부채 ?? [0]);
  const latestAssets = latest(bsData?.총자산 ?? [0]);
  const debtRatio = latestAssets > 0 ? Math.round((latestDebt / latestAssets) * 100) : 30;

  const recentFcf = latest(cfData?.FCF ?? [0]);
  const historicGrowth = useMemo(() => {
    const rates = growthData?.매출액성장률 ?? [];
    if (rates.length === 0) return 3;
    const valid = rates.filter((r: number) => r > -50 && r !== 0);
    return valid.length > 0 ? valid.reduce((a: number, b: number) => a + b, 0) / valid.length : 3;
  }, [growthData]);

  const [p, setP] = useState<DCFParams>({
    forecastPeriod: 5,
    riskFreeRate: 2.5,
    marketRiskPremium: 5.5,
    beta: 1.1,
    costOfDebt: 4.0,
    taxRate: 22.0,
    debtWeight: debtRatio,
    customWacc: null,
    initialGrowthRate: Math.max(-10, Math.min(historicGrowth, 15)),
    terminalGrowthRate: Math.min(2, Math.max(0, historicGrowth / 3)),
    growthYears: 3,
    growthDecay: true,
    baseFcf: recentFcf || 100,
    fcfAdjustment: 0,
  });

  const set = (key: keyof DCFParams, val: number | boolean | null) => setP((prev) => ({ ...prev, [key]: val }));

  const costOfEquity = p.riskFreeRate + p.beta * p.marketRiskPremium;
  const calculatedWacc = (costOfEquity * (100 - p.debtWeight) / 100) + (p.costOfDebt * (1 - p.taxRate / 100) * p.debtWeight / 100);
  const wacc = p.customWacc !== null ? p.customWacc : calculatedWacc;
  const adjustedFcf = p.baseFcf * (1 + p.fcfAdjustment / 100);

  const calculate = () => {
    const waccDecimal = wacc / 100;
    const initGrowth = p.initialGrowthRate / 100;
    const termGrowth = p.terminalGrowthRate / 100;
    const netDebt = latestDebt;

    const growthRates: number[] = [];
    for (let yr = 0; yr < p.forecastPeriod; yr++) {
      if (yr < p.growthYears) {
        if (p.growthDecay) {
          const decay = (p.growthYears - yr) / p.growthYears;
          growthRates.push(initGrowth * decay + termGrowth * (1 - decay));
        } else {
          growthRates.push(initGrowth);
        }
      } else {
        growthRates.push(termGrowth);
      }
    }

    const fcfs: number[] = [];
    let curFcf = adjustedFcf;
    for (const gr of growthRates) {
      fcfs.push(curFcf);
      curFcf *= (1 + gr);
    }

    const pvs = fcfs.map((fcf, i) => fcf / Math.pow(1 + waccDecimal, i + 1));
    const terminalValue = fcfs[fcfs.length - 1] * (1 + termGrowth) / (waccDecimal - termGrowth);
    const pvTerminal = terminalValue / Math.pow(1 + waccDecimal, p.forecastPeriod);
    const ev = pvs.reduce((a, b) => a + b, 0) + pvTerminal;
    const equityValue = ev - netDebt;

    // Sensitivity: WACC
    const waccSens: Record<string, number> = {};
    for (let w = Math.max(wacc - 3, 1); w <= wacc + 3; w += 1.5) {
      const wd = w / 100;
      const tpvs = fcfs.map((f, i) => f / Math.pow(1 + wd, i + 1));
      const ttv = fcfs[fcfs.length - 1] * (1 + termGrowth) / (wd - termGrowth);
      const tptv = ttv / Math.pow(1 + wd, p.forecastPeriod);
      waccSens[`${w.toFixed(1)}%`] = Math.round(tpvs.reduce((a, b) => a + b, 0) + tptv - netDebt);
    }

    onSubmit({
      method: 'DCF',
      enterprise_value: Math.round(ev),
      equity_value: Math.round(equityValue),
      details: {
        forecast_period: p.forecastPeriod,
        wacc: wacc,
        base_fcf: adjustedFcf,
        net_debt: netDebt,
        fcfs: fcfs.map((f) => Math.round(f)),
        growth_rates: growthRates.map((g) => +(g * 100).toFixed(1)),
        present_values: pvs.map((v) => Math.round(v)),
        terminal_value: Math.round(terminalValue),
        pv_terminal: Math.round(pvTerminal),
        terminal_pct: +((pvTerminal / ev) * 100).toFixed(1),
      },
      sensitivity: { wacc: waccSens },
    });
  };

  return (
    <div className="space-y-4">
      {/* Forecast Period */}
      <ParamGroup title="예측 기간 설정">
        <RangeInput label="예측 기간 (년)" value={p.forecastPeriod} min={3} max={10} step={1} onChange={(v) => set('forecastPeriod', v)} />
      </ParamGroup>

      {/* WACC */}
      <ParamGroup title="할인율 (WACC) 설정">
        <div className="grid grid-cols-2 gap-4">
          <NumberInput label="무위험수익률 (%)" value={p.riskFreeRate} step={0.1} onChange={(v) => set('riskFreeRate', v)} />
          <NumberInput label="베타 (β)" value={p.beta} step={0.05} onChange={(v) => set('beta', v)} />
          <NumberInput label="시장위험프리미엄 (%)" value={p.marketRiskPremium} step={0.1} onChange={(v) => set('marketRiskPremium', v)} />
          <NumberInput label="부채비용 (%)" value={p.costOfDebt} step={0.1} onChange={(v) => set('costOfDebt', v)} />
          <RangeInput label="부채 비중 (%)" value={p.debtWeight} min={0} max={100} step={1} onChange={(v) => set('debtWeight', v)} />
          <NumberInput label="법인세율 (%)" value={p.taxRate} step={0.5} onChange={(v) => set('taxRate', v)} />
        </div>
        <InfoBox>계산된 WACC (가중평균자본비용): <strong>{calculatedWacc.toFixed(2)}%</strong></InfoBox>
        <label className="flex items-center gap-2 text-sm mt-2">
          <input type="checkbox" checked={p.customWacc !== null} onChange={(e) => set('customWacc', e.target.checked ? calculatedWacc : null)} />
          직접 입력
        </label>
        {p.customWacc !== null && (
          <NumberInput label="직접 입력 WACC (%)" value={p.customWacc} step={0.1} onChange={(v) => set('customWacc', v)} />
        )}
      </ParamGroup>

      {/* Growth */}
      <ParamGroup title="성장률 설정">
        <InfoBox>과거 평균 성장률: <strong>{historicGrowth.toFixed(1)}%</strong></InfoBox>
        <div className="grid grid-cols-2 gap-4">
          <NumberInput label="초기 성장률 (%)" value={p.initialGrowthRate} step={0.5} onChange={(v) => set('initialGrowthRate', v)} />
          <NumberInput label="영구 성장률 (%)" value={p.terminalGrowthRate} step={0.1} onChange={(v) => set('terminalGrowthRate', v)} />
          <RangeInput label="성장 예측 기간 (년)" value={p.growthYears} min={1} max={p.forecastPeriod} step={1} onChange={(v) => set('growthYears', v)} />
          <label className="flex items-center gap-2 text-sm self-center">
            <input type="checkbox" checked={p.growthDecay} onChange={(e) => set('growthDecay', e.target.checked)} />
            성장률 점진적 감소
          </label>
        </div>
      </ParamGroup>

      {/* FCF */}
      <ParamGroup title="현금흐름 조정">
        <InfoBox>최근 FCF: <strong>{formatBillion(recentFcf)}억원</strong></InfoBox>
        <div className="grid grid-cols-2 gap-4">
          <NumberInput label="FCF 기준값 (억원)" value={p.baseFcf} step={10} onChange={(v) => set('baseFcf', v)} />
          <RangeInput label="FCF 조정 (%)" value={p.fcfAdjustment} min={-50} max={50} step={5} onChange={(v) => set('fcfAdjustment', v)} />
        </div>
        <InfoBox>조정된 FCF 기준값: <strong>{formatBillion(Math.round(adjustedFcf))}억원</strong></InfoBox>
      </ParamGroup>

      <SubmitButton onClick={calculate} />
    </div>
  );
}

/* ────── Multiples Form ────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MultiplesForm({ perfData, bsData, cfData, onSubmit }: { perfData: any; bsData: any; cfData: any; onSubmit: (r: ValuationResult) => void }) {
  const netIncome = latest(perfData?.순이익 ?? [0]);
  const equity = latest(bsData?.자본총계 ?? [0]);
  const revenue = latest(perfData?.매출액 ?? [0]);
  const opProfit = latest(perfData?.영업이익 ?? [0]);

  const [p, setP] = useState<MultiplesParams>({
    selectedMultiples: ['PER', 'PBR', 'EV/EBITDA'],
    industryMultiples: { PER: 12, PBR: 1.5, PSR: 1, 'EV/EBITDA': 8, 'EV/Sales': 2, 'P/FCF': 15 },
    discountPremium: 0,
    multipleWeights: { PER: 34, PBR: 33, 'EV/EBITDA': 33 },
  });

  const allMultiples = ['PER', 'PBR', 'PSR', 'EV/EBITDA', 'EV/Sales', 'P/FCF'];

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
    const baseValues: Record<string, number> = {
      PER: netIncome,
      PBR: equity,
      PSR: revenue,
      'EV/EBITDA': opProfit * 1.3, // rough EBITDA estimate
      'EV/Sales': revenue,
      'P/FCF': latest(cfData?.FCF ?? [0]) || opProfit * 0.7,
    };

    const valuations: Record<string, number> = {};
    let weightedSum = 0;
    let totalWeight = 0;

    for (const m of p.selectedMultiples) {
      const base = baseValues[m] || 0;
      const multiple = p.industryMultiples[m] || 0;
      const val = base * multiple * (1 + p.discountPremium / 100);
      valuations[m] = Math.round(val);
      const weight = (p.multipleWeights[m] || 0) / 100;
      weightedSum += val * weight;
      totalWeight += weight;
    }

    const finalValue = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

    onSubmit({
      method: '상대가치법',
      equity_value: finalValue,
      enterprise_value: finalValue + latest(bsData?.총부채 ?? [0]),
      details: { valuations, weights: p.multipleWeights, discount_premium: p.discountPremium },
    });
  };

  return (
    <div className="space-y-4">
      <ParamGroup title="상대가치 배수 선택">
        <div className="flex flex-wrap gap-2">
          {allMultiples.map((m) => (
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

/* ────── Asset Form ────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AssetForm({ bsData, onSubmit }: { bsData: any; onSubmit: (r: ValuationResult) => void }) {
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
    const adjustedAssets =
      totalAssets * (p.realEstatePercent / 100) * (1 + p.realEstateAdj / 100) +
      totalAssets * (p.equipmentPercent / 100) * (1 + p.equipmentAdj / 100) +
      totalAssets * (p.inventoryPercent / 100) * (1 + p.inventoryAdj / 100) +
      totalAssets * (p.intangiblePercent / 100) * (1 + p.intangibleAdj / 100) +
      totalAssets * (otherPercent / 100) * (1 + p.otherAdj / 100);

    const adjustedLiabilities = totalLiabilities * (1 + p.liabilityAdj / 100) + p.contingentLiability;
    const liquidationCost = adjustedAssets * (p.liquidationCostPercent / 100);
    const nav = adjustedAssets - adjustedLiabilities - liquidationCost;

    onSubmit({
      method: '자산가치법',
      equity_value: Math.round(nav),
      enterprise_value: Math.round(nav + adjustedLiabilities),
      details: {
        original_assets: totalAssets,
        adjusted_assets: Math.round(adjustedAssets),
        original_liabilities: totalLiabilities,
        adjusted_liabilities: Math.round(adjustedLiabilities),
        liquidation_cost: Math.round(liquidationCost),
      },
    });
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

/* ────── Combined Form ────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CombinedForm({ perfData, bsData, cfData, onSubmit }: { perfData: any; bsData: any; cfData: any; onSubmit: (r: ValuationResult) => void }) {
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
    const results: { method: string; value: number; weight: number }[] = [];

    if (p.useDcf) {
      const waccD = p.dcfWacc / 100;
      const tg = p.dcfTerminalGrowth / 100;
      const tv = p.dcfBaseFcf * (1 + tg) / (waccD - tg);
      const pv = tv / Math.pow(1 + waccD, 5);
      // Simple 5-year DCF
      let pvSum = 0;
      let fcf = p.dcfBaseFcf;
      for (let i = 1; i <= 5; i++) {
        pvSum += fcf / Math.pow(1 + waccD, i);
        fcf *= 1 + tg;
      }
      const ev = pvSum + pv;
      const eq = ev - latest(bsData?.총부채 ?? [0]);
      results.push({ method: 'DCF', value: Math.round(eq), weight: p.dcfWeight });
    }

    if (p.useMultiples) {
      const netIncome = latest(perfData?.순이익 ?? [0]);
      const equity = latest(bsData?.자본총계 ?? [0]);
      const opProfit = latest(perfData?.영업이익 ?? [0]);
      const perVal = netIncome * p.perMultiple;
      const pbrVal = equity * p.pbrMultiple;
      const evEbitdaVal = opProfit * 1.3 * p.evEbitdaMultiple - latest(bsData?.총부채 ?? [0]);
      const avg = (perVal + pbrVal + evEbitdaVal) / 3 * (1 + p.multiplesDiscount / 100);
      results.push({ method: '상대가치법', value: Math.round(avg), weight: p.multiplesWeight });
    }

    if (p.useAsset) {
      const assets = latest(bsData?.총자산 ?? [0]) * (1 + p.assetAdj / 100);
      const liabilities = latest(bsData?.총부채 ?? [0]) * (1 + p.liabilityAdj / 100);
      results.push({ method: '자산가치법', value: Math.round(assets - liabilities), weight: p.assetWeight });
    }

    const totalWeight = results.reduce((a, r) => a + r.weight, 0);
    const weightedValue = totalWeight > 0
      ? Math.round(results.reduce((a, r) => a + r.value * r.weight, 0) / totalWeight)
      : 0;

    onSubmit({
      method: '복합 가치평가법',
      equity_value: weightedValue,
      details: {
        methods: results,
        total_weight: totalWeight,
      },
    });
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

/* ────── Results View ────── */
function ResultsView({ result, onReset }: { result: ValuationResult; onReset: () => void }) {
  const chartLabels: string[] | null = result.details?.methods
    ? result.details.methods.map((m: { method: string }) => m.method)
    : result.details?.fcfs
    ? result.details.fcfs.map((_: number, i: number) => `${i + 1}년차`)
    : null;

  const chartDatasets: { label: string; data: number[]; color?: string }[] | null = result.details?.methods
    ? [{ label: '평가 가치 (억원)', data: result.details.methods.map((m: { value: number }) => m.value) }]
    : result.details?.fcfs
    ? [{ label: '예상 FCF (억원)', data: result.details.fcfs }]
    : null;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
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

      {/* Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-3">상세 내역 ({result.method})</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(result.details || {}).map(([key, val]) => {
            if (typeof val === 'object') return null;
            return (
              <div key={key} className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">{key}</span>
                <span className="font-medium">{typeof val === 'number' ? (key.includes('pct') || key.includes('rate') || key.includes('wacc') ? formatPercent(val as number) : formatBillion(val as number)) : String(val)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      {chartLabels && chartDatasets && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <BarChart labels={chartLabels} datasets={chartDatasets} height={250} />
        </div>
      )}

      {/* Sensitivity */}
      {result.sensitivity?.wacc && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">WACC 민감도 분석</h3>
          <div className="flex gap-2">
            {Object.entries(result.sensitivity.wacc as Record<string, number>).map(([wacc, val]) => (
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

/* ────── Shared UI Components ────── */
function ParamGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="font-semibold text-indigo-600 text-sm mb-3">{title}</h4>
      {children}
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return <div className="bg-gray-50 border-l-3 border-indigo-500 px-3 py-2 rounded text-sm my-2" style={{ borderLeftWidth: 3 }}>{children}</div>;
}

function NumberInput({ label, value, step, onChange }: { label: string; value: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  );
}

function RangeInput({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between">
        <label className="text-xs text-gray-500">{label}</label>
        <span className="text-xs font-medium text-indigo-600">{value}</span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-indigo-600"
      />
    </div>
  );
}

function SubmitButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="text-center">
      <button
        onClick={onClick}
        className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
      >
        가치평가 계산 시작
      </button>
    </div>
  );
}
