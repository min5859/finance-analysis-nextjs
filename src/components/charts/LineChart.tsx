'use client';

import { Line } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import { defaultFont, COLOR_PALETTE } from './chartConfig';

interface LineChartProps {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
    yAxisID?: string;
  }>;
  title?: string;
  y2AxisLabel?: string;
  height?: number;
}

export default function LineChart({ labels, datasets, title, y2AxisLabel, height = 350 }: LineChartProps) {
  const colors = [COLOR_PALETTE.primary, COLOR_PALETTE.success, COLOR_PALETTE.warning];
  const hasSecondAxis = datasets.some((ds) => ds.yAxisID === 'y1');

  const data = {
    labels,
    datasets: datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.color || colors[i % colors.length],
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointRadius: 5,
      pointBackgroundColor: ds.color || colors[i % colors.length],
      tension: 0.3,
      yAxisID: ds.yAxisID || 'y',
      datalabels: {
        display: true,
        anchor: 'end' as const,
        align: 'top' as const,
        font: { ...defaultFont, size: 10 },
        color: ds.color || colors[i % colors.length],
        formatter: (value: number) => value.toFixed(1),
      },
    })),
  };

  const options: ChartOptions<'line'> = {
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
      ...(hasSecondAxis
        ? {
            y1: {
              beginAtZero: true,
              position: 'right' as const,
              grid: { drawOnChartArea: false },
              ticks: { font: defaultFont },
              title: y2AxisLabel ? { display: true, text: y2AxisLabel, font: defaultFont } : undefined,
            },
          }
        : {}),
    },
  };

  return (
    <div style={{ height }}>
      <Line data={data} options={options} />
    </div>
  );
}
