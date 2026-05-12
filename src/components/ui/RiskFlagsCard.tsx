import type { RiskFlag, RiskSeverity, RiskCategory } from '@/features/financial-analysis/risk-flags';

const SEVERITY_STYLE: Record<RiskSeverity, { dot: string; label: string; color: string }> = {
  critical: { dot: 'bg-red-600', label: '심각', color: 'text-red-700' },
  high: { dot: 'bg-orange-500', label: '높음', color: 'text-orange-700' },
  medium: { dot: 'bg-yellow-500', label: '중간', color: 'text-yellow-700' },
  low: { dot: 'bg-gray-400', label: '낮음', color: 'text-gray-600' },
};

const CATEGORY_LABEL: Record<RiskCategory, string> = {
  profitability: '수익성',
  liquidity: '유동성',
  leverage: '레버리지',
  efficiency: '효율성',
  cash: '현금흐름',
};

export default function RiskFlagsCard({ flags }: { flags: RiskFlag[] }) {
  if (flags.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <h3 className="font-semibold text-gray-800 mb-1">자동 점검 — 위험 신호 없음</h3>
        <p className="text-sm text-gray-600">현재 데이터에서 사전 정의된 룰에 걸리는 항목이 없습니다.</p>
      </div>
    );
  }

  const counts = flags.reduce<Record<RiskSeverity, number>>(
    (acc, f) => ({ ...acc, [f.severity]: (acc[f.severity] ?? 0) + 1 }),
    { critical: 0, high: 0, medium: 0, low: 0 },
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-800">자동 점검 — 위험 신호</h3>
          <p className="text-xs text-gray-500 mt-0.5">룰 기반 검사 ({flags.length}건 감지)</p>
        </div>
        <div className="flex gap-2 text-xs">
          {(['critical', 'high', 'medium', 'low'] as RiskSeverity[]).map((s) =>
            counts[s] > 0 ? (
              <span key={s} className={`${SEVERITY_STYLE[s].color} font-medium`}>
                {SEVERITY_STYLE[s].label} {counts[s]}
              </span>
            ) : null,
          )}
        </div>
      </div>
      <ul className="space-y-2">
        {flags.map((f) => (
          <li key={f.id} className="flex items-start gap-3 py-2 border-t border-gray-100 first:border-t-0">
            <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${SEVERITY_STYLE[f.severity].dot}`} aria-hidden />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-800">{f.title}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                  {CATEGORY_LABEL[f.category]}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{f.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
