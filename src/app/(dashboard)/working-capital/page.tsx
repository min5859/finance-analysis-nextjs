'use client';
import { useCompanyStore } from '@/store/company-store';
import { DataLoader } from '@/lib/data-loader';
import SlideHeader from '@/components/ui/SlideHeader';
import MetricCard from '@/components/ui/MetricCard';
import InsightCard from '@/components/ui/InsightCard';
import ChartCard from '@/components/charts/ChartCard';
import BarChart from '@/components/charts/BarChart';
import { latest, previous, formatDays } from '@/lib/format';

function evaluateCCC(ccc: number, thresholds?: { very_good?: number; good?: number; normal?: number; caution: number }) {
  const t = thresholds || { very_good: 30, good: 60, normal: 90, caution: 120 };
  if (ccc <= (t.very_good || 30)) return { grade: '매우 우수', color: 'text-emerald-600', bgColor: 'bg-emerald-50' };
  if (ccc <= (t.good || 60)) return { grade: '우수', color: 'text-emerald-600', bgColor: 'bg-emerald-50' };
  if (ccc <= (t.normal || 90)) return { grade: '보통', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
  return { grade: '주의', color: 'text-red-500', bgColor: 'bg-red-50' };
}

export default function WorkingCapitalPage() {
  const companyData = useCompanyStore((s) => s.companyData);
  if (!companyData) return <p className="text-gray-500 text-center py-12">기업 데이터를 먼저 로드해주세요.</p>;

  const dl = new DataLoader(companyData);
  const wc = dl.getWorkingCapitalData();
  const cf = dl.getCashFlowData();
  const insights = dl.getInsights();

  const latestCCC = latest(wc.CCC);
  const prevCCC = previous(wc.CCC);
  const cccEval = evaluateCCC(latestCCC, insights.working_capital?.ccc_thresholds);
  const industryAvgCCC = insights.working_capital?.industry_avg_ccc;

  // CCC-FCF correlation analysis
  const latestFCF = latest(cf.FCF);
  const prevFCF = previous(cf.FCF);
  const cccDelta = latestCCC - prevCCC;
  const fcfDelta = latestFCF - prevFCF;

  return (
    <div>
      <SlideHeader title="운전자본 분석" />
      <InsightCard title={insights.working_capital?.title} content={insights.working_capital?.content1} variant="blue" />
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard title="CCC" value={latestCCC} prevValue={prevCCC} unit="일" invertDelta />
        <MetricCard title="DSO" value={latest(wc.DSO)} prevValue={previous(wc.DSO)} unit="일" invertDelta />
        <MetricCard title="DIO" value={latest(wc.DIO)} prevValue={previous(wc.DIO)} unit="일" invertDelta />
        <MetricCard title="DPO" value={latest(wc.DPO)} prevValue={previous(wc.DPO)} unit="일" />
      </div>
      <ChartCard title="운전자본 효율성 추이 (단위: 일)">
        <BarChart
          labels={wc.year}
          datasets={[
            { label: 'DSO', data: wc.DSO, color: '#4f46e5' },
            { label: 'DIO', data: wc.DIO, color: '#10b981' },
            { label: 'DPO', data: wc.DPO, color: '#f59e0b' },
            { label: 'CCC', data: wc.CCC, color: '#ef4444' },
          ]}
        />
      </ChartCard>

      {/* CCC Efficiency Change */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 my-4">
        <h3 className="font-semibold text-gray-800 mb-3">CCC 효율성 변화</h3>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="text-center">
            <p className="text-gray-500">전기</p>
            <p className="font-bold text-lg">{formatDays(prevCCC)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">당기</p>
            <p className="font-bold text-lg">{formatDays(latestCCC)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">변동</p>
            <p className={`font-bold text-lg ${cccDelta < 0 ? 'text-emerald-600' : cccDelta > 0 ? 'text-red-500' : 'text-gray-600'}`}>
              {cccDelta > 0 ? '+' : ''}{formatDays(cccDelta)}
            </p>
          </div>
        </div>
      </div>

      {/* CCC Threshold Evaluation */}
      <div className={`rounded-lg border p-4 my-4 ${cccEval.bgColor}`}>
        <h3 className="font-semibold text-gray-800 mb-2">CCC 종합 평가</h3>
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-bold ${cccEval.color}`}>{cccEval.grade}</span>
          <span className="text-sm text-gray-600">
            현금순환주기 {formatDays(latestCCC)}
            {industryAvgCCC != null && ` (업계 평균: ${formatDays(industryAvgCCC)})`}
          </span>
        </div>
        {industryAvgCCC != null && (
          <p className="text-sm mt-2 text-gray-600">
            {latestCCC < industryAvgCCC
              ? `업계 평균 대비 ${formatDays(industryAvgCCC - latestCCC)} 빠른 현금순환으로 운전자본 효율이 우수합니다.`
              : `업계 평균 대비 ${formatDays(latestCCC - industryAvgCCC)} 느린 현금순환으로 개선이 필요합니다.`}
          </p>
        )}
      </div>

      {/* CCC-FCF Correlation */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 my-4">
        <h3 className="font-semibold text-gray-800 mb-2">CCC-FCF 상관관계 분석</h3>
        <p className="text-sm text-gray-600">
          {cccDelta < 0 && fcfDelta > 0 && 'CCC 감소와 FCF 증가가 동시에 나타나, 운전자본 효율 개선이 현금흐름에 긍정적 영향을 주고 있습니다.'}
          {cccDelta > 0 && fcfDelta < 0 && 'CCC 증가와 FCF 감소가 동시에 나타나, 운전자본 비효율이 현금흐름을 압박하고 있습니다.'}
          {cccDelta < 0 && fcfDelta < 0 && 'CCC는 개선되었으나 FCF는 감소하였습니다. 영업활동 외 요인을 점검할 필요가 있습니다.'}
          {cccDelta > 0 && fcfDelta > 0 && 'CCC는 악화되었으나 FCF는 증가하였습니다. 영업이익 증가가 운전자본 비효율을 상쇄하고 있습니다.'}
          {cccDelta === 0 && 'CCC 변동이 없습니다.'}
        </p>
      </div>

      {insights.working_capital?.content2 && <InsightCard content={insights.working_capital.content2} />}
    </div>
  );
}
