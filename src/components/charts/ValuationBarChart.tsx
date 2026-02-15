'use client';

import { Bar } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import { defaultFont, COLOR_PALETTE } from './chartConfig';

interface ValuationBarChartProps {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
  title?: string;
  height?: number;
}

export default function ValuationBarChart({ labels, datasets, title, height = 350 }: ValuationBarChartProps) {
  const colors = [COLOR_PALETTE.primary, COLOR_PALETTE.success, COLOR_PALETTE.warning];

  const data = {
    labels,
    datasets: datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: ds.color || colors[i % colors.length],
      borderRadius: 4,
      datalabels: {
        display: true,
        anchor: 'end' as const,
        align: 'end' as const,
        font: { ...defaultFont, size: 10 },
        color: '#666',
        formatter: (value: number) => `${value.toLocaleString('ko-KR')}`,
      },
    })),
  };

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: defaultFont } },
      tooltip: { mode: 'index', intersect: false },
      title: title ? { display: true, text: title, font: defaultFont } : undefined,
    },
    scales: {
      x: { beginAtZero: true, ticks: { font: defaultFont } },
      y: { ticks: { font: defaultFont } },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  );
}
