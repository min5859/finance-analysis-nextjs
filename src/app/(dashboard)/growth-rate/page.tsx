'use client';
import { useFinancialData } from '@/hooks/useFinancialData';
import EmptyState from '@/components/ui/EmptyState';
import { COLOR_PALETTE } from '@/components/charts/chartConfig';
import SlideHeader from '@/components/ui/SlideHeader';
import InsightCard from '@/components/ui/InsightCard';
import ChartCard from '@/components/charts/ChartCard';
import BarChart from '@/components/charts/BarChart';

export default function GrowthRatePage() {
  const { dl } = useFinancialData();
  if (!dl) return <EmptyState />;
  const gr = dl.getGrowthRates();
  const insights = dl.getInsights();

  return (
    <div>
      <SlideHeader title="성장성 분석" />
      <InsightCard title={insights.growth_rates?.title} content={insights.growth_rates?.content1} variant="blue" />
      <div className="bg-white rounded-lg border border-gray-200 p-4 my-4">
        <table className="w-full text-sm">
          <thead><tr className="border-b"><th className="text-left py-2">지표</th>{gr.year.map(y => <th key={y} className="text-right py-2">{y}</th>)}</tr></thead>
          <tbody>
            {(['총자산성장률', '매출액성장률', '순이익성장률'] as const).map(key => (
              <tr key={key} className="border-b last:border-0">
                <td className="py-2 font-medium">{key}</td>
                {gr[key].map((v, i) => (
                  <td key={i} className={`text-right py-2 font-medium ${v >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{v.toFixed(1)}%</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ChartCard title="성장률 추이">
        <BarChart
          labels={gr.year}
          datasets={[
            { label: '총자산성장률', data: gr.총자산성장률, color: COLOR_PALETTE.primary },
            { label: '매출액성장률', data: gr.매출액성장률, color: COLOR_PALETTE.success },
            { label: '순이익성장률', data: gr.순이익성장률, color: COLOR_PALETTE.warning },
          ]}
        />
      </ChartCard>
      {insights.growth_rates?.content2 && <InsightCard content={insights.growth_rates.content2} />}
    </div>
  );
}
