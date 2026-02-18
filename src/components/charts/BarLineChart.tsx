'use client';

import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { defaultFont, COLOR_PALETTE } from './chartConfig';

interface BarLineChartProps {
  labels: string[];
  barDatasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
  lineDatasets?: Array<{
    label: string;
    data: number[];
    color?: string;
    yAxisID?: string;
  }>;
  title?: string;
  yAxisLabel?: string;
  y2AxisLabel?: string;
  height?: number;
}

export default function BarLineChart({
  labels,
  barDatasets,
  lineDatasets = [],
  title,
  yAxisLabel,
  y2AxisLabel,
  height = 350,
}: BarLineChartProps) {
  const colors = [COLOR_PALETTE.primary, COLOR_PALETTE.success, COLOR_PALETTE.warning, COLOR_PALETTE.danger];

  const datasets = [
    ...barDatasets.map((ds, i) => ({
      type: 'bar' as const,
      label: ds.label,
      data: ds.data,
      backgroundColor: ds.color || colors[i % colors.length],
      borderRadius: 4,
      datalabels: {
        display: true,
        anchor: 'end' as const,
        align: 'top' as const,
        font: { ...defaultFont, size: 10 },
        color: COLOR_PALETTE.muted,
      },
    })),
    ...lineDatasets.map((ds, i) => ({
      type: 'line' as const,
      label: ds.label,
      data: ds.data,
      borderColor: ds.color || COLOR_PALETTE.danger,
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointRadius: 4,
      yAxisID: ds.yAxisID || 'y1',
      datalabels: {
        display: true,
        anchor: 'end' as const,
        align: 'top' as const,
        font: { ...defaultFont, size: 10 },
        color: ds.color || COLOR_PALETTE.danger,
        formatter: (value: number) => value.toFixed(1),
      },
      order: -(i + 1), // line을 bar 위에 표시
    })),
  ];

  const data: ChartData<'bar'> = {
    labels,
    datasets: datasets as ChartData<'bar'>['datasets'],
  };

  const hasSecondAxis = lineDatasets.some((ds) => ds.yAxisID === 'y1');

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: defaultFont } },
      tooltip: { mode: 'index', intersect: false },
      title: title ? { display: true, text: title, font: { ...defaultFont, size: 14 } } : undefined,
    },
    scales: {
      x: { ticks: { font: defaultFont } },
      y: {
        beginAtZero: true,
        position: 'left',
        ticks: { font: defaultFont },
        title: yAxisLabel ? { display: true, text: yAxisLabel, font: defaultFont } : undefined,
      },
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
      <Bar data={data} options={options} />
    </div>
  );
}
