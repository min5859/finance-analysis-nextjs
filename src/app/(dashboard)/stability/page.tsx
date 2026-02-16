'use client';
import { useFinancialData } from '@/hooks/useFinancialData';
import EmptyState from '@/components/ui/EmptyState';
import { COLOR_PALETTE } from '@/components/charts/chartConfig';
import SlideHeader from '@/components/ui/SlideHeader';
import MetricCard from '@/components/ui/MetricCard';
import InsightCard from '@/components/ui/InsightCard';
import ChartCard from '@/components/charts/ChartCard';
import LineChart from '@/components/charts/LineChart';
import { evaluateFinancialSafety } from '@/features/financial-analysis/evaluators';
import { latest, previous } from '@/lib/format';

export default function StabilityPage() {
  const { dl } = useFinancialData();
  if (!dl) return <EmptyState />;
  const stab = dl.getStabilityData();
  const insights = dl.getInsights();
  const safety = evaluateFinancialSafety(stab, insights.stability?.thresholds);

  return (
    <div>
      <SlideHeader title="안정성 분석" />
      <InsightCard title={insights.stability?.title} content={insights.stability?.content1} variant="blue" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard title="부채비율" value={latest(stab.부채비율)} prevValue={previous(stab.부채비율)} unit="%" invertDelta />
        <MetricCard title="유동비율" value={latest(stab.유동비율)} prevValue={previous(stab.유동비율)} unit="%" />
        <MetricCard title="이자보상배율" value={latest(stab.이자보상배율)} prevValue={previous(stab.이자보상배율)} unit="배" />
      </div>
      <ChartCard title="안정성 지표 추이">
        <LineChart
          labels={stab.year}
          datasets={[
            { label: '부채비율 (%)', data: stab.부채비율, color: COLOR_PALETTE.danger },
            { label: '유동비율 (%)', data: stab.유동비율, color: COLOR_PALETTE.primary },
            { label: '이자보상배율 (배)', data: stab.이자보상배율, color: COLOR_PALETTE.warning, yAxisID: 'y1' },
          ]}
          y2AxisLabel="배"
        />
      </ChartCard>
      <div className="bg-white rounded-lg border border-gray-200 p-4 my-4">
        <h3 className="font-semibold text-gray-800 mb-3">재무안정성 종합 평가</h3>
        <div className="text-center mb-4">
          <span className="text-4xl font-bold text-indigo-600">{safety.grade}</span>
        </div>
        {safety.items.map((item, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
            <span className="text-sm text-gray-600">{item.label}</span>
            <span className="text-sm font-medium">{item.value}</span>
            <span className={`text-sm font-medium ${item.color}`}>{item.status}</span>
          </div>
        ))}
      </div>
      {insights.stability?.content2 && <InsightCard content={insights.stability.content2} />}
    </div>
  );
}
