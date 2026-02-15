'use client';
import { useCompanyStore } from '@/store/company-store';
import { DataLoader } from '@/lib/data-loader';
import SlideHeader from '@/components/ui/SlideHeader';
import MetricCard from '@/components/ui/MetricCard';
import { latest, previous } from '@/lib/format';

export default function SummaryPage() {
  const companyData = useCompanyStore((s) => s.companyData);
  if (!companyData) return <p className="text-gray-500 text-center py-12">기업 데이터를 먼저 로드해주세요.</p>;

  const dl = new DataLoader(companyData);
  const perf = dl.getPerformanceData();
  const prof = dl.getProfitabilityData();
  const stab = dl.getStabilityData();
  const cf = dl.getCashFlowData();
  const gr = dl.getGrowthRates();

  return (
    <div>
      <SlideHeader title="요약" subtitle={`${dl.getCompanyName()} (${dl.getSector()})`} />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard title="매출액" value={latest(perf.매출액)} prevValue={previous(perf.매출액)} unit="억원" />
        <MetricCard title="영업이익" value={latest(perf.영업이익)} prevValue={previous(perf.영업이익)} unit="억원" />
        <MetricCard title="ROE" value={latest(prof.ROE)} prevValue={previous(prof.ROE)} unit="%" />
        <MetricCard title="부채비율" value={latest(stab.부채비율)} prevValue={previous(stab.부채비율)} unit="%" invertDelta />
        <MetricCard title="유동비율" value={latest(stab.유동비율)} prevValue={previous(stab.유동비율)} unit="%" />
        <MetricCard title="영업활동 현금흐름" value={latest(cf.영업활동)} prevValue={previous(cf.영업활동)} unit="억원" />
      </div>
      {gr.year.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3">주요 하이라이트</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>매출 성장률: <span className={latest(gr.매출액성장률) >= 0 ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>{latest(gr.매출액성장률).toFixed(1)}%</span></li>
            <li>순이익 성장률: <span className={latest(gr.순이익성장률) >= 0 ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>{latest(gr.순이익성장률).toFixed(1)}%</span></li>
            <li>영업이익률: {latest(perf.영업이익률).toFixed(1)}%</li>
            <li>부채비율: {latest(stab.부채비율).toFixed(1)}%</li>
            <li>FCF: {latest(cf.FCF).toLocaleString('ko-KR')} 억원</li>
          </ul>
        </div>
      )}
    </div>
  );
}
