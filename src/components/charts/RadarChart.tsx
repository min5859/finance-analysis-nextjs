'use client';

import { Radar } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import { defaultFont, COLOR_PALETTE } from './chartConfig';

interface RadarChartProps {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
    fillColor?: string;
  }>;
  title?: string;
  height?: number;
}

export default function RadarChart({ labels, datasets, title, height = 400 }: RadarChartProps) {
  const colors = [COLOR_PALETTE.primary, COLOR_PALETTE.warning];

  const data = {
    labels,
    datasets: datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.color || colors[i % colors.length],
      backgroundColor: ds.fillColor || `${ds.color || colors[i % colors.length]}33`,
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: ds.color || colors[i % colors.length],
      datalabels: { display: false },
    })),
  };

  const maxValue = Math.max(...datasets.flatMap((ds) => ds.data), 10);

  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: defaultFont } },
      title: title ? { display: true, text: title, font: { ...defaultFont, size: 14 } } : undefined,
    },
    scales: {
      r: {
        beginAtZero: true,
        max: Math.ceil(maxValue * 1.2),
        ticks: { font: { ...defaultFont, size: 9 } },
        pointLabels: { font: { ...defaultFont, size: 11 } },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Radar data={data} options={options} />
    </div>
  );
}
