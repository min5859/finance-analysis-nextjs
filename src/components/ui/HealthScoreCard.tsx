import type { FScoreResult, DistressResult } from '@/features/financial-analysis/health-scores';

const GRADE_STYLE: Record<FScoreResult['grade'], { label: string; color: string; bg: string }> = {
  strong: { label: '우수', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  moderate: { label: '보통', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  weak: { label: '취약', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  insufficient: { label: '데이터 부족', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' },
};

const DISTRESS_STYLE: Record<DistressResult['level'], { label: string; color: string; bg: string }> = {
  safe: { label: '안전', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  watch: { label: '관찰', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  danger: { label: '위험', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

const SIGNAL_DOT: Record<'safe' | 'watch' | 'danger', string> = {
  safe: 'bg-emerald-500',
  watch: 'bg-yellow-500',
  danger: 'bg-red-500',
};

export function FScoreCard({ result }: { result: FScoreResult }) {
  const style = GRADE_STYLE[result.grade];
  return (
    <div className={`rounded-lg border ${style.bg} p-4`}>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-800">Piotroski F-Score</h3>
          <p className="text-xs text-gray-500 mt-0.5">이익의 질·재무 개선도 (8개 항목)</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold text-gray-900">{result.score}</span>
          <span className="text-sm text-gray-500"> / {result.max}</span>
          <p className={`text-sm font-medium ${style.color}`}>{style.label}</p>
        </div>
      </div>
      <ul className="space-y-1.5">
        {result.checks.map((c, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className={c.passed ? 'text-emerald-600' : 'text-gray-400'} aria-hidden>
              {c.passed ? '✓' : '·'}
            </span>
            <span className="flex-1 text-gray-700">{c.label}</span>
            <span className="text-xs text-gray-500">{c.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DistressCard({ result }: { result: DistressResult }) {
  const style = DISTRESS_STYLE[result.level];
  return (
    <div className={`rounded-lg border ${style.bg} p-4`}>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-800">부실 신호</h3>
          <p className="text-xs text-gray-500 mt-0.5">한계기업·이익의 질 룰 기반 평가</p>
        </div>
        <span className={`text-lg font-bold ${style.color}`}>{style.label}</span>
      </div>
      <ul className="space-y-1.5">
        {result.signals.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${SIGNAL_DOT[s.level]}`} aria-hidden />
            <span className="flex-1 text-gray-700">{s.label}</span>
            <span className="text-xs text-gray-500">{s.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
