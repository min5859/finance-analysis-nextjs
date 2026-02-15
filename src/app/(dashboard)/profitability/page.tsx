'use client';
import { useCompanyStore } from '@/store/company-store';
import { DataLoader } from '@/lib/data-loader';
import SlideHeader from '@/components/ui/SlideHeader';
import MetricCard from '@/components/ui/MetricCard';
import InsightCard from '@/components/ui/InsightCard';
import ChartCard from '@/components/charts/ChartCard';
import BarLineChart from '@/components/charts/BarLineChart';
import { latest, previous } from '@/lib/format';

export default function ProfitabilityPage() {
  const companyData = useCompanyStore((s) => s.companyData);
  if (!companyData) return <p className="text-gray-500 text-center py-12">기업 데이터를 먼저 로드해주세요.</p>;

  const dl = new DataLoader(companyData);
  const dupont = dl.getDupontData();
  const insights = dl.getInsights();

  return (
    <div>
      <SlideHeader title="수익성 분석 (듀폰 분석)" />
      <InsightCard title={insights.profitability?.title} content={insights.profitability?.content1} variant="blue" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard title="순이익률" value={latest(dupont.순이익률)} prevValue={previous(dupont.순이익률)} unit="%" />
        <MetricCard title="자산회전율" value={latest(dupont.자산회전율)} prevValue={previous(dupont.자산회전율)} unit="회" />
        <MetricCard title="재무레버리지" value={latest(dupont.재무레버리지)} prevValue={previous(dupont.재무레버리지)} unit="배" />
      </div>
      <ChartCard title="듀폰 분석 (ROE 구성요소)">
        <BarLineChart
          labels={dupont.year}
          barDatasets={[
            { label: '순이익률 (%)', data: dupont.순이익률, color: '#4f46e5' },
            { label: '자산회전율 (회)', data: dupont.자산회전율, color: '#10b981' },
            { label: '재무레버리지 (배)', data: dupont.재무레버리지, color: '#f59e0b' },
          ]}
          lineDatasets={[
            { label: 'ROE (%)', data: dupont.ROE, color: '#ef4444', yAxisID: 'y1' },
          ]}
        />
      </ChartCard>
      {insights.profitability?.content2 && <InsightCard content={insights.profitability.content2} />}
    </div>
  );
}
