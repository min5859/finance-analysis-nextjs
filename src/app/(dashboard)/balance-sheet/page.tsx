'use client';
import { useCompanyStore } from '@/store/company-store';
import { DataLoader } from '@/lib/data-loader';
import SlideHeader from '@/components/ui/SlideHeader';
import MetricCard from '@/components/ui/MetricCard';
import InsightCard from '@/components/ui/InsightCard';
import ChartCard from '@/components/charts/ChartCard';
import BarLineChart from '@/components/charts/BarLineChart';
import { latest, previous } from '@/lib/format';

export default function BalanceSheetPage() {
  const companyData = useCompanyStore((s) => s.companyData);
  if (!companyData) return <p className="text-gray-500 text-center py-12">기업 데이터를 먼저 로드해주세요.</p>;

  const dl = new DataLoader(companyData);
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
            { label: '총자산', data: bs.총자산, color: '#4f46e5' },
            { label: '총부채', data: bs.총부채, color: '#ef4444' },
            { label: '자본총계', data: bs.자본총계, color: '#10b981' },
          ]}
          lineDatasets={[
            { label: '총자산 추세', data: bs.총자산, color: '#4f46e5', yAxisID: 'y1' },
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
