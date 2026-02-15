'use client';

import { Bar } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import { defaultFont, COLOR_PALETTE } from './chartConfig';

interface BarChartProps {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
  title?: string;
  height?: number;
}

export default function BarChart({ labels, datasets, title, height = 350 }: BarChartProps) {
  const colors = [COLOR_PALETTE.primary, COLOR_PALETTE.success, COLOR_PALETTE.warning, COLOR_PALETTE.danger];

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
        align: 'top' as const,
        font: { ...defaultFont, size: 10 },
        color: '#666',
      },
    })),
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: defaultFont } },
      tooltip: { mode: 'index', intersect: false },
      title: title ? { display: true, text: title, font: defaultFont } : undefined,
    },
    scales: {
      x: { ticks: { font: defaultFont } },
      y: { beginAtZero: true, ticks: { font: defaultFont } },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  );
}
