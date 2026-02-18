import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Chart.js 글로벌 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
  ChartDataLabels
);

export const COLOR_PALETTE = {
  primary: '#4f46e5',
  secondary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#8b5cf6',
  light: '#f3f4f6',
  dark: '#1f2937',
  muted: '#666666',
  white: '#ffffff',
  headerFrom: '#0a1172',
  headerVia: '#1a237e',
  headerTo: '#283593',
} as const;

export const CHART_COLORS = [
  COLOR_PALETTE.primary,
  COLOR_PALETTE.success,
  COLOR_PALETTE.warning,
  COLOR_PALETTE.danger,
  COLOR_PALETTE.secondary,
  COLOR_PALETTE.info,
];

export const defaultFont = {
  family: "'Noto Sans KR', sans-serif",
};

export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: { font: defaultFont },
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
    },
    datalabels: {
      display: false, // 기본적으로 끔, 개별 차트에서 활성화
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { font: defaultFont },
    },
    x: {
      ticks: { font: defaultFont },
    },
  },
};
