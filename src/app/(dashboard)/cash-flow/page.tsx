'use client';
import { useCompanyStore } from '@/store/company-store';
import { DataLoader } from '@/lib/data-loader';
import SlideHeader from '@/components/ui/SlideHeader';
import MetricCard from '@/components/ui/MetricCard';
import InsightCard from '@/components/ui/InsightCard';
import ChartCard from '@/components/charts/ChartCard';
import BarChart from '@/components/charts/BarChart';
import { latest, previous } from '@/lib/format';

export default function CashFlowPage() {
  const companyData = useCompanyStore((s) => s.companyData);
  if (!companyData) return <p className="text-gray-500 text-center py-12">기업 데이터를 먼저 로드해주세요.</p>;

  const dl = new DataLoader(companyData);
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
            { label: '영업활동', data: cf.영업활동, color: '#4f46e5' },
            { label: '투자활동', data: cf.투자활동, color: '#ef4444' },
            { label: 'FCF', data: cf.FCF, color: '#10b981' },
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
