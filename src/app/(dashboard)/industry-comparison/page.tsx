'use client';
import { useFinancialData } from '@/hooks/useFinancialData';
import EmptyState from '@/components/ui/EmptyState';
import { COLOR_PALETTE } from '@/components/charts/chartConfig';
import SlideHeader from '@/components/ui/SlideHeader';
import ChartCard from '@/components/charts/ChartCard';
import RadarChart from '@/components/charts/RadarChart';

export default function IndustryComparisonPage() {
  const { dl } = useFinancialData();
  if (!dl) return <EmptyState />;
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
            { label: companyName, data: companyValues, color: COLOR_PALETTE.primary, fillColor: `${COLOR_PALETTE.primary}33` },
            { label: '업계평균', data: industryValues, color: COLOR_PALETTE.warning, fillColor: `${COLOR_PALETTE.warning}33` },
          ]}
          height={450}
        />
      </ChartCard>
    </div>
  );
}
