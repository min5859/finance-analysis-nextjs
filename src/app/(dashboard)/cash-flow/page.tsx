'use client';
import { useFinancialData } from '@/hooks/useFinancialData';
import EmptyState from '@/components/ui/EmptyState';
import { COLOR_PALETTE } from '@/components/charts/chartConfig';
import SlideHeader from '@/components/ui/SlideHeader';
import MetricCard from '@/components/ui/MetricCard';
import InsightCard from '@/components/ui/InsightCard';
import ChartCard from '@/components/charts/ChartCard';
import BarChart from '@/components/charts/BarChart';
import { latest, previous } from '@/lib/format';

export default function CashFlowPage() {
  const { dl } = useFinancialData();
  if (!dl) return <EmptyState />;
  const cf = dl.getCashFlowData();
  const insights = dl.getInsights();

  return (
    <div>
      <SlideHeader title="현금흐름표" />
      <InsightCard title={insights.cash_flow?.title} content={insights.cash_flow?.content1} variant="blue" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard title="영업활동 현금흐름" value={latest(cf.영업활동)} prevValue={previous(cf.영업활동)} unit="억원" />
        <MetricCard title="투자활동 현금흐름" value={latest(cf.투자활동)} prevValue={previous(cf.투자활동)} unit="억원" invertDelta />
        <MetricCard title="FCF" value={latest(cf.FCF)} prevValue={previous(cf.FCF)} unit="억원" />
      </div>
      <ChartCard title="현금흐름 추이">
        <BarChart
          labels={cf.year}
          datasets={[
            { label: '영업활동', data: cf.영업활동, color: COLOR_PALETTE.primary },
            { label: '투자활동', data: cf.투자활동, color: COLOR_PALETTE.danger },
            { label: 'FCF', data: cf.FCF, color: COLOR_PALETTE.success },
          ]}
        />
      </ChartCard>
      {insights.cash_flow?.content2 && <InsightCard title="현금흐름 요약" content={insights.cash_flow.content2} />}
      {insights.cash_flow_causes && (
        <InsightCard title={insights.cash_flow_causes.title || '현금흐름 변동 요인'} content={insights.cash_flow_causes.content1} variant="green" />
      )}
      {insights.cash_flow_diagnosis && (
        <InsightCard title={insights.cash_flow_diagnosis.title || '현금흐름 진단'} content={insights.cash_flow_diagnosis.content1} variant="red" />
      )}
    </div>
  );
}
