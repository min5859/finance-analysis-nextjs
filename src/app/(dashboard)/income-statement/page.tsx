'use client';
import { useCompanyStore } from '@/store/company-store';
import { DataLoader } from '@/lib/data-loader';
import SlideHeader from '@/components/ui/SlideHeader';
import MetricCard from '@/components/ui/MetricCard';
import InsightCard from '@/components/ui/InsightCard';
import ChartCard from '@/components/charts/ChartCard';
import BarLineChart from '@/components/charts/BarLineChart';
import { latest, previous } from '@/lib/format';

export default function IncomeStatementPage() {
  const companyData = useCompanyStore((s) => s.companyData);
  if (!companyData) return <p className="text-gray-500 text-center py-12">기업 데이터를 먼저 로드해주세요.</p>;

  const dl = new DataLoader(companyData);
  const perf = dl.getPerformanceData();
  const insights = dl.getInsights();

  return (
    <div>
      <SlideHeader title="손익계산서" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard title="매출액" value={latest(perf.매출액)} prevValue={previous(perf.매출액)} unit="억원" />
        <MetricCard title="영업이익" value={latest(perf.영업이익)} prevValue={previous(perf.영업이익)} unit="억원" />
        <MetricCard title="순이익" value={latest(perf.순이익)} prevValue={previous(perf.순이익)} unit="억원" />
      </div>
      <ChartCard title="매출 및 이익 추이">
        <BarLineChart
          labels={perf.year}
          barDatasets={[
            { label: '매출액', data: perf.매출액, color: '#4f46e5' },
            { label: '영업이익', data: perf.영업이익, color: '#10b981' },
            { label: '순이익', data: perf.순이익, color: '#f59e0b' },
          ]}
          lineDatasets={[
            { label: '순이익률 (%)', data: perf.순이익률, color: '#ef4444', yAxisID: 'y1' },
          ]}
          yAxisLabel="억원"
          y2AxisLabel="%"
        />
      </ChartCard>
      <InsightCard title={insights.income_statement?.title} content={insights.income_statement?.content1} />
      {insights.income_statement?.content2 && (
        <InsightCard content={insights.income_statement.content2} variant="blue" />
      )}
    </div>
  );
}
