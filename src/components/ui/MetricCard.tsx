import { formatBillion, formatPercent } from '@/lib/format';

interface MetricCardProps {
  title: string;
  value: number;
  prevValue?: number;
  unit?: '억원' | '%' | '배' | '일' | '회';
  invertDelta?: boolean; // 음수가 좋은 경우 (예: 부채비율)
}

export default function MetricCard({ title, value, prevValue, unit = '억원', invertDelta = false }: MetricCardProps) {
  const delta = prevValue !== undefined ? value - prevValue : null;
  const isPositive = delta !== null ? (invertDelta ? delta < 0 : delta > 0) : null;

  const formatValue = (v: number) => {
    switch (unit) {
      case '억원': return formatBillion(v);
      case '%': return formatPercent(v);
      case '배': return `${v.toFixed(2)}`;
      case '일': return `${v.toFixed(1)}`;
      case '회': return `${v.toFixed(2)}`;
      default: return v.toLocaleString('ko-KR');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">
        {formatValue(value)}
        {unit !== '억원' ? '' : <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
      </p>
      {delta !== null && (
        <p className={`text-sm mt-1 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
          {delta > 0 ? '+' : ''}{formatValue(delta)} {unit}
        </p>
      )}
    </div>
  );
}
