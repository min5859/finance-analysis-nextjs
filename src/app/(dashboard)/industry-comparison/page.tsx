'use client';
import { useCompanyStore } from '@/store/company-store';
import { DataLoader } from '@/lib/data-loader';
import SlideHeader from '@/components/ui/SlideHeader';
import ChartCard from '@/components/charts/ChartCard';
import RadarChart from '@/components/charts/RadarChart';

export default function IndustryComparisonPage() {
  const companyData = useCompanyStore((s) => s.companyData);
  if (!companyData) return <p className="text-gray-500 text-center py-12">기업 데이터를 먼저 로드해주세요.</p>;

  const dl = new DataLoader(companyData);
  const radar = dl.getRadarData();
  const companyName = dl.getCompanyName();

  const companyValues = (radar[companyName] as number[]) || Object.values(radar).find((v): v is number[] => Array.isArray(v) && typeof v[0] === 'number') || [];
  const industryValues = (radar['업계평균'] as number[]) || [];

  return (
    <div>
      <SlideHeader title="업계비교 현황" subtitle={dl.getReportYear() ? `${dl.getReportYear()}년 기준` : undefined} />
      <ChartCard title={`${companyName} vs 업계평균`}>
        <RadarChart
          labels={radar.metric as string[]}
          datasets={[
            { label: companyName, data: companyValues, color: '#4f46e5', fillColor: '#4f46e533' },
            { label: '업계평균', data: industryValues, color: '#f59e0b', fillColor: '#f59e0b33' },
          ]}
          height={450}
        />
      </ChartCard>
    </div>
  );
}
