'use client';

import { useMemo, useState } from 'react';
import type { DCFParams } from '../types';
import { calculateDCF } from '../calculators/dcf';
import { formatBillion } from '@/lib/format';
import BarChart from '@/components/charts/BarChart';
import RangeInput from '@/components/ui/RangeInput';

interface SensitivityPanelProps {
  params: DCFParams;
  baseWacc: number;
  baseAdjustedFcf: number;
  latestDebt: number;
}

interface Delta {
  /** %p (절대 % point) 단위로 WACC/terminal-growth 보정. */
  wacc: number;
  terminal: number;
  initial: number;
}

const ZERO: Delta = { wacc: 0, terminal: 0, initial: 0 };

function withDelta(p: DCFParams, baseWacc: number, baseFcf: number, d: Delta) {
  const wacc = Math.max(1, baseWacc + d.wacc);
  const initial = p.initialGrowthRate + d.initial;
  const terminal = Math.max(0, p.terminalGrowthRate + d.terminal);
  // terminal 이 WACC 보다 크면 영구가치 공식 발산. terminal 을 wacc 보다 0.5%p 아래로 클램프.
  const safeTerminal = Math.min(terminal, wacc - 0.5);
  return {
    params: { ...p, initialGrowthRate: initial, terminalGrowthRate: safeTerminal },
    wacc,
    adjustedFcf: baseFcf,
  };
}

function buildTornado(
  base: DCFParams,
  baseWacc: number,
  baseFcf: number,
  latestDebt: number,
  baseEquity: number,
) {
  const axes: { key: keyof Delta; label: string; lo: Delta; hi: Delta }[] = [
    { key: 'wacc', label: 'WACC ±2%p', lo: { ...ZERO, wacc: -2 }, hi: { ...ZERO, wacc: 2 } },
    { key: 'terminal', label: '영구성장 ±1%p', lo: { ...ZERO, terminal: -1 }, hi: { ...ZERO, terminal: 1 } },
    { key: 'initial', label: '초기성장 ±5%p', lo: { ...ZERO, initial: -5 }, hi: { ...ZERO, initial: 5 } },
  ];

  const rows = axes.map(({ key, label, lo, hi }) => {
    const a = withDelta(base, baseWacc, baseFcf, lo);
    const b = withDelta(base, baseWacc, baseFcf, hi);
    const loValue = calculateDCF(a.params, a.wacc, a.adjustedFcf, latestDebt).equity_value;
    const hiValue = calculateDCF(b.params, b.wacc, b.adjustedFcf, latestDebt).equity_value;
    return { key, label, loDelta: loValue - baseEquity, hiDelta: hiValue - baseEquity };
  });

  // 큰 영향 → 위쪽으로 정렬
  rows.sort((a, b) =>
    Math.max(Math.abs(b.loDelta), Math.abs(b.hiDelta)) - Math.max(Math.abs(a.loDelta), Math.abs(a.hiDelta)),
  );

  return rows;
}

export default function SensitivityPanel({
  params,
  baseWacc,
  baseAdjustedFcf,
  latestDebt,
}: SensitivityPanelProps) {
  const [delta, setDelta] = useState<Delta>(ZERO);

  const scenario = useMemo(() => {
    const ctx = withDelta(params, baseWacc, baseAdjustedFcf, delta);
    return calculateDCF(ctx.params, ctx.wacc, ctx.adjustedFcf, latestDebt);
  }, [params, baseWacc, baseAdjustedFcf, latestDebt, delta]);

  const baseResult = useMemo(
    () => calculateDCF(params, baseWacc, baseAdjustedFcf, latestDebt),
    [params, baseWacc, baseAdjustedFcf, latestDebt],
  );

  const tornado = useMemo(
    () => buildTornado(params, baseWacc, baseAdjustedFcf, latestDebt, baseResult.equity_value),
    [params, baseWacc, baseAdjustedFcf, latestDebt, baseResult.equity_value],
  );

  const diff = scenario.equity_value - baseResult.equity_value;
  const diffPct = baseResult.equity_value !== 0 ? (diff / baseResult.equity_value) * 100 : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-5">
      <div>
        <h3 className="font-semibold text-gray-800">시나리오 / 민감도</h3>
        <p className="text-xs text-gray-500 mt-0.5">가정을 살짝 비틀었을 때 가치가 얼마나 흔들리는지 즉시 확인.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RangeInput
          label={`WACC 보정 (${delta.wacc >= 0 ? '+' : ''}${delta.wacc.toFixed(1)}%p)`}
          value={delta.wacc}
          min={-3}
          max={3}
          step={0.5}
          onChange={(v) => setDelta((d) => ({ ...d, wacc: v }))}
        />
        <RangeInput
          label={`영구성장 보정 (${delta.terminal >= 0 ? '+' : ''}${delta.terminal.toFixed(1)}%p)`}
          value={delta.terminal}
          min={-2}
          max={2}
          step={0.25}
          onChange={(v) => setDelta((d) => ({ ...d, terminal: v }))}
        />
        <RangeInput
          label={`초기성장 보정 (${delta.initial >= 0 ? '+' : ''}${delta.initial.toFixed(1)}%p)`}
          value={delta.initial}
          min={-10}
          max={10}
          step={1}
          onChange={(v) => setDelta((d) => ({ ...d, initial: v }))}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">기준 가치</p>
          <p className="font-semibold text-gray-800">{formatBillion(baseResult.equity_value)}억원</p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">시나리오 가치</p>
          <p className="font-semibold text-indigo-700">{formatBillion(scenario.equity_value)}억원</p>
        </div>
        <div className={`rounded-lg p-3 ${diff >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className="text-xs text-gray-500">변화</p>
          <p className={`font-semibold ${diff >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {diff >= 0 ? '+' : ''}{formatBillion(diff)}억 ({diff >= 0 ? '+' : ''}{diffPct.toFixed(1)}%)
          </p>
        </div>
      </div>

      <button
        onClick={() => setDelta(ZERO)}
        className="text-xs text-gray-500 hover:text-indigo-600"
      >
        기준값으로 초기화
      </button>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">파라미터별 영향 (토네이도)</h4>
        <BarChart
          labels={tornado.map((r) => r.label)}
          datasets={[
            { label: '하방 변화 (억원)', data: tornado.map((r) => r.loDelta) },
            { label: '상방 변화 (억원)', data: tornado.map((r) => r.hiDelta) },
          ]}
          horizontal
          height={200}
        />
        <p className="text-xs text-gray-500 mt-2">
          기준 가치 {formatBillion(baseResult.equity_value)}억원 대비 각 파라미터를 한 번에 ±변형했을 때의 영향.
          폭이 클수록 가치 평가가 그 가정에 민감합니다.
        </p>
      </div>
    </div>
  );
}
