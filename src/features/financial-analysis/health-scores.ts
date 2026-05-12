import type { CompanyFinancialData } from '@/types/company';

export interface FScoreCheck {
  label: string;
  passed: boolean;
  detail: string;
}

export interface FScoreResult {
  score: number;
  max: number;
  grade: 'strong' | 'moderate' | 'weak' | 'insufficient';
  checks: FScoreCheck[];
}

export interface DistressSignal {
  label: string;
  level: 'safe' | 'watch' | 'danger';
  detail: string;
}

export interface DistressResult {
  level: 'safe' | 'watch' | 'danger';
  signals: DistressSignal[];
}

const last = (arr?: number[]) => (arr && arr.length > 0 ? arr[arr.length - 1] : undefined);
const prev = (arr?: number[]) => (arr && arr.length >= 2 ? arr[arr.length - 2] : undefined);

/**
 * Piotroski F-Score 변형.
 *
 * 원본은 9개 척도(주식 발행 여부 포함)지만 본 프로젝트의 추출 스키마에는
 * 주식 발행/매출총이익이 없어서 8개로 축소. 영업이익률을 매출총이익률 대신,
 * dupont 자산회전율을 자산회전율로 사용.
 *
 * 점수 산식은 단순한 Pass/Fail(각 1점). 최대 8점.
 */
export function calculatePiotroskiFScore(data: CompanyFinancialData): FScoreResult {
  const checks: FScoreCheck[] = [];

  const roaLast = last(data.profitability_data?.ROA);
  const roaPrev = prev(data.profitability_data?.ROA);
  const cfoLast = last(data.cash_flow_data?.영업활동);
  const niLast = last(data.performance_data?.순이익);
  const debtLast = last(data.stability_data?.부채비율);
  const debtPrev = prev(data.stability_data?.부채비율);
  const curLast = last(data.stability_data?.유동비율);
  const curPrev = prev(data.stability_data?.유동비율);
  const opmLast = last(data.performance_data?.영업이익률);
  const opmPrev = prev(data.performance_data?.영업이익률);
  const turnLast = last(data.dupont_data?.자산회전율);
  const turnPrev = prev(data.dupont_data?.자산회전율);

  const push = (label: string, passed: boolean, detail: string) =>
    checks.push({ label, passed, detail });

  if (roaLast !== undefined) push('ROA > 0', roaLast > 0, `ROA ${roaLast.toFixed(2)}%`);
  if (cfoLast !== undefined) push('영업현금흐름 > 0', cfoLast > 0, `OCF ${cfoLast.toLocaleString('ko-KR')}억`);
  if (roaLast !== undefined && roaPrev !== undefined)
    push('ROA 개선', roaLast > roaPrev, `${roaPrev.toFixed(2)}% → ${roaLast.toFixed(2)}%`);
  if (cfoLast !== undefined && niLast !== undefined)
    push(
      'OCF > 순이익 (이익의 질)',
      cfoLast > niLast,
      `OCF ${cfoLast.toLocaleString('ko-KR')} vs NI ${niLast.toLocaleString('ko-KR')}`,
    );
  if (debtLast !== undefined && debtPrev !== undefined)
    push('부채비율 감소', debtLast < debtPrev, `${debtPrev.toFixed(1)}% → ${debtLast.toFixed(1)}%`);
  if (curLast !== undefined && curPrev !== undefined)
    push('유동비율 개선', curLast > curPrev, `${curPrev.toFixed(1)}% → ${curLast.toFixed(1)}%`);
  if (opmLast !== undefined && opmPrev !== undefined)
    push('영업이익률 개선', opmLast > opmPrev, `${opmPrev.toFixed(2)}% → ${opmLast.toFixed(2)}%`);
  if (turnLast !== undefined && turnPrev !== undefined)
    push('자산회전율 개선', turnLast > turnPrev, `${turnPrev.toFixed(2)} → ${turnLast.toFixed(2)}`);

  const score = checks.filter((c) => c.passed).length;
  const max = checks.length;

  let grade: FScoreResult['grade'];
  if (max < 6) grade = 'insufficient';
  else if (score >= 7) grade = 'strong';
  else if (score >= 4) grade = 'moderate';
  else grade = 'weak';

  return { score, max, grade, checks };
}

/**
 * 부실/위험 신호 (룰 기반).
 *
 * 정식 Altman Z-Score 는 운전자본·이익잉여금 절댓값이 필요한데
 * 본 프로젝트 추출 스키마는 비율만 가지고 있어서 원본 공식이 성립 안 함.
 * 그래서 한국 IFRS 기준으로 흔히 보는 4개 신호를 룰 기반으로 평가.
 *
 * - 부채비율 (200% 초과 위험, 400% 초과 심각)
 * - 이자보상배율 (1배 미만 = 영업이익으로 이자 못 갚음 = 한계기업 후보)
 * - OCF < 순이익 3년 연속 (이익의 질 의심)
 * - 영업이익률 음수
 */
export function detectDistressSignals(data: CompanyFinancialData): DistressResult {
  const signals: DistressSignal[] = [];

  const debt = last(data.stability_data?.부채비율);
  if (debt !== undefined) {
    if (debt >= 400)
      signals.push({ label: '부채비율 심각', level: 'danger', detail: `${debt.toFixed(1)}% (400% 초과)` });
    else if (debt >= 200)
      signals.push({ label: '부채비율 높음', level: 'watch', detail: `${debt.toFixed(1)}% (200% 초과)` });
    else signals.push({ label: '부채비율', level: 'safe', detail: `${debt.toFixed(1)}%` });
  }

  const cov = last(data.stability_data?.이자보상배율);
  if (cov !== undefined) {
    if (cov < 1)
      signals.push({
        label: '한계기업 위험',
        level: 'danger',
        detail: `이자보상배율 ${cov.toFixed(2)}배 < 1`,
      });
    else if (cov < 1.5)
      signals.push({
        label: '이자보상배율 낮음',
        level: 'watch',
        detail: `${cov.toFixed(2)}배 (1.5배 미만)`,
      });
    else
      signals.push({
        label: '이자상환 여력',
        level: 'safe',
        detail: `${cov.toFixed(2)}배`,
      });
  }

  const opm = last(data.performance_data?.영업이익률);
  if (opm !== undefined) {
    if (opm < 0)
      signals.push({
        label: '영업적자',
        level: 'danger',
        detail: `영업이익률 ${opm.toFixed(2)}%`,
      });
  }

  const cf = data.cash_flow_data?.영업활동 ?? [];
  const ni = data.performance_data?.순이익 ?? [];
  const matchLen = Math.min(cf.length, ni.length);
  if (matchLen >= 3) {
    const tail = matchLen >= 3 ? 3 : matchLen;
    let streak = 0;
    for (let i = matchLen - tail; i < matchLen; i++) {
      if (cf[i] < ni[i]) streak++;
    }
    if (streak === tail)
      signals.push({
        label: '이익의 질 의심',
        level: 'watch',
        detail: `최근 ${tail}년 OCF < 순이익`,
      });
  }

  const danger = signals.some((s) => s.level === 'danger');
  const watch = signals.some((s) => s.level === 'watch');
  const level: DistressResult['level'] = danger ? 'danger' : watch ? 'watch' : 'safe';

  return { level, signals };
}
