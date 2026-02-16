import type { StabilityData } from '@/types/company';

interface ThresholdConfig {
  debt_ratio?: { very_safe?: number; safe?: number; normal?: number; caution: number };
  current_ratio?: { very_good?: number; good?: number; fair?: number; caution: number };
  interest_coverage?: { very_good?: number; good?: number; fair?: number; caution: number };
}

interface SafetyItem {
  label: string;
  value: string;
  status: string;
  color: string;
}

interface SafetyResult {
  grade: string;
  score: number;
  items: SafetyItem[];
}

export function evaluateFinancialSafety(
  stab: StabilityData,
  thresholds?: ThresholdConfig
): SafetyResult {
  const debt = stab.부채비율[stab.부채비율.length - 1] ?? 0;
  const current = stab.유동비율[stab.유동비율.length - 1] ?? 0;
  const interest = stab.이자보상배율[stab.이자보상배율.length - 1] ?? 0;

  const t = thresholds || {
    debt_ratio: { very_safe: 50, safe: 80, normal: 120, caution: 200 },
    current_ratio: { very_good: 200, good: 150, fair: 100, caution: 80 },
    interest_coverage: { very_good: 5, good: 3, fair: 1.5, caution: 1 },
  };

  let score = 0;
  const items: SafetyItem[] = [];

  // Debt ratio
  if (debt <= (t.debt_ratio?.very_safe || 50)) {
    score += 3; items.push({ label: '부채비율', value: `${debt.toFixed(1)}%`, status: '매우 안전', color: 'text-emerald-600' });
  } else if (debt <= (t.debt_ratio?.safe || 80)) {
    score += 2; items.push({ label: '부채비율', value: `${debt.toFixed(1)}%`, status: '안전', color: 'text-emerald-600' });
  } else if (debt <= (t.debt_ratio?.normal || 120)) {
    score += 1; items.push({ label: '부채비율', value: `${debt.toFixed(1)}%`, status: '보통', color: 'text-yellow-600' });
  } else {
    score -= 1; items.push({ label: '부채비율', value: `${debt.toFixed(1)}%`, status: '주의', color: 'text-red-500' });
  }

  // Current ratio
  if (current >= (t.current_ratio?.very_good || 200)) {
    score += 3; items.push({ label: '유동비율', value: `${current.toFixed(1)}%`, status: '매우 양호', color: 'text-emerald-600' });
  } else if (current >= (t.current_ratio?.good || 150)) {
    score += 2; items.push({ label: '유동비율', value: `${current.toFixed(1)}%`, status: '양호', color: 'text-emerald-600' });
  } else if (current >= (t.current_ratio?.fair || 100)) {
    score += 1; items.push({ label: '유동비율', value: `${current.toFixed(1)}%`, status: '적정', color: 'text-yellow-600' });
  } else {
    score -= 1; items.push({ label: '유동비율', value: `${current.toFixed(1)}%`, status: '주의', color: 'text-red-500' });
  }

  // Interest coverage
  if (interest >= (t.interest_coverage?.very_good || 5)) {
    score += 3; items.push({ label: '이자보상배율', value: `${interest.toFixed(1)}배`, status: '매우 양호', color: 'text-emerald-600' });
  } else if (interest >= (t.interest_coverage?.good || 3)) {
    score += 2; items.push({ label: '이자보상배율', value: `${interest.toFixed(1)}배`, status: '양호', color: 'text-emerald-600' });
  } else if (interest >= (t.interest_coverage?.fair || 1.5)) {
    score += 1; items.push({ label: '이자보상배율', value: `${interest.toFixed(1)}배`, status: '적정', color: 'text-yellow-600' });
  } else {
    score -= 1; items.push({ label: '이자보상배율', value: `${interest.toFixed(1)}배`, status: '주의', color: 'text-red-500' });
  }

  let grade = 'B';
  if (score >= 8) grade = 'AAA';
  else if (score >= 6) grade = 'AA';
  else if (score >= 4) grade = 'A';
  else if (score >= 2) grade = 'BBB';
  else if (score >= 0) grade = 'BB';

  return { grade, score, items };
}

export interface CCCResult {
  grade: string;
  color: string;
  bgColor: string;
}

export function evaluateCCC(
  ccc: number,
  thresholds?: { very_good?: number; good?: number; normal?: number; caution: number }
): CCCResult {
  const t = thresholds || { very_good: 30, good: 60, normal: 90, caution: 120 };
  if (ccc <= (t.very_good || 30)) return { grade: '매우 우수', color: 'text-emerald-600', bgColor: 'bg-emerald-50' };
  if (ccc <= (t.good || 60)) return { grade: '우수', color: 'text-emerald-600', bgColor: 'bg-emerald-50' };
  if (ccc <= (t.normal || 90)) return { grade: '보통', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
  return { grade: '주의', color: 'text-red-500', bgColor: 'bg-red-50' };
}
