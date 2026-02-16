'use client';
import { useFinancialData } from '@/hooks/useFinancialData';
import EmptyState from '@/components/ui/EmptyState';
import { COLOR_PALETTE } from '@/components/charts/chartConfig';
import SlideHeader from '@/components/ui/SlideHeader';
import MetricCard from '@/components/ui/MetricCard';
import InsightCard from '@/components/ui/InsightCard';
import ChartCard from '@/components/charts/ChartCard';
import BarLineChart from '@/components/charts/BarLineChart';
import { latest, previous } from '@/lib/format';

export default function BalanceSheetPage() {
  const { dl } = useFinancialData();
  if (!dl) return <EmptyState />;
  const bs = dl.getBalanceSheetData();
  const insights = dl.getInsights();

  return (
    <div>
      <SlideHeader title="재무상태표" />
      <InsightCard title={insights.balance_sheet?.title} content={insights.balance_sheet?.content1} variant="blue" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard title="총자산" value={latest(bs.총자산)} prevValue={previous(bs.총자산)} unit="억원" />
        <MetricCard title="총부채" value={latest(bs.총부채)} prevValue={previous(bs.총부채)} unit="억원" invertDelta />
        <MetricCard title="자본총계" value={latest(bs.자본총계)} prevValue={previous(bs.자본총계)} unit="억원" />
      </div>
      <ChartCard title="재무상태 추이">
        <BarLineChart
          labels={bs.year}
          barDatasets={[
            { label: '총자산', data: bs.총자산, color: COLOR_PALETTE.primary },
            { label: '총부채', data: bs.총부채, color: COLOR_PALETTE.danger },
            { label: '자본총계', data: bs.자본총계, color: COLOR_PALETTE.success },
          ]}
          lineDatasets={[
            { label: '총자산 추세', data: bs.총자산, color: COLOR_PALETTE.primary, yAxisID: 'y1' },
          ]}
          yAxisLabel="억원"
        />
      </ChartCard>
      {insights.balance_sheet?.content2 && (
        <InsightCard content={insights.balance_sheet.content2} />
      )}
    </div>
  );
}
