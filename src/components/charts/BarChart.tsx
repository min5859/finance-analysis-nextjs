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
  horizontal?: boolean;
  datalabelFormatter?: (v: number) => string;
}

export default function BarChart({ labels, datasets, title, height = 350, horizontal, datalabelFormatter }: BarChartProps) {
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
        align: horizontal ? ('end' as const) : ('top' as const),
        font: { ...defaultFont, size: 10 },
        color: COLOR_PALETTE.muted,
        ...(datalabelFormatter ? { formatter: datalabelFormatter } : {}),
      },
    })),
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    ...(horizontal ? { indexAxis: 'y' as const } : {}),
    plugins: {
      legend: { position: 'top', labels: { font: defaultFont } },
      tooltip: { mode: 'index', intersect: false },
      title: title ? { display: true, text: title, font: defaultFont } : undefined,
    },
    scales: horizontal
      ? { x: { beginAtZero: true, ticks: { font: defaultFont } }, y: { ticks: { font: defaultFont } } }
      : { x: { ticks: { font: defaultFont } }, y: { beginAtZero: true, ticks: { font: defaultFont } } },
  };

  return (
    <div style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  );
}
