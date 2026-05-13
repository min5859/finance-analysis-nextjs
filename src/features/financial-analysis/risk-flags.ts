import type { CompanyFinancialData } from '@/types/company';

export type RiskSeverity = 'critical' | 'high' | 'medium' | 'low';
export type RiskCategory = 'profitability' | 'liquidity' | 'leverage' | 'efficiency' | 'cash';

export interface RiskFlag {
  id: string;
  severity: RiskSeverity;
  category: RiskCategory;
  title: string;
  detail: string;
}

/** 타입은 number[] 이지만 raw JSON 에 null 이 섞일 수 있어 null-safe 인덱싱. */
const safeAt = (arr: number[] | undefined, idx: number): number | undefined => {
  if (!arr || idx < 0 || idx >= arr.length) return undefined;
  const v = arr[idx];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
};
const last = (arr?: number[]) => (arr ? safeAt(arr, arr.length - 1) : undefined);
const prev = (arr?: number[]) => (arr ? safeAt(arr, arr.length - 2) : undefined);
const prev2 = (arr?: number[]) => (arr ? safeAt(arr, arr.length - 3) : undefined);

type Rule = (data: CompanyFinancialData) => RiskFlag | null;

const rules: Rule[] = [
  // ── 수익성 ──
  function netLoss(d) {
    const ni = last(d.performance_data?.순이익);
    if (ni === undefined || ni >= 0) return null;
    return {
      id: 'net-loss',
      severity: 'high',
      category: 'profitability',
      title: '당기순손실',
      detail: `${ni.toLocaleString('ko-KR')}억`,
    };
  },

  function opLoss(d) {
    const op = last(d.performance_data?.영업이익);
    if (op === undefined || op >= 0) return null;
    return {
      id: 'op-loss',
      severity: 'critical',
      category: 'profitability',
      title: '영업적자',
      detail: `${op.toLocaleString('ko-KR')}억`,
    };
  },

  function revenueDecline(d) {
    const a = last(d.performance_data?.매출액);
    const b = prev(d.performance_data?.매출액);
    const c = prev2(d.performance_data?.매출액);
    if (a === undefined || b === undefined) return null;
    if (c !== undefined && a < b && b < c) {
      return {
        id: 'revenue-decline-2y',
        severity: 'high',
        category: 'profitability',
        title: '매출 2년 연속 감소',
        detail: `${c.toLocaleString('ko-KR')} → ${b.toLocaleString('ko-KR')} → ${a.toLocaleString('ko-KR')}억`,
      };
    }
    if (a < b) {
      return {
        id: 'revenue-decline',
        severity: 'medium',
        category: 'profitability',
        title: '매출 감소',
        detail: `${b.toLocaleString('ko-KR')} → ${a.toLocaleString('ko-KR')}억`,
      };
    }
    return null;
  },

  function roeCollapse(d) {
    const a = last(d.profitability_data?.ROE);
    const b = prev(d.profitability_data?.ROE);
    if (a === undefined || b === undefined) return null;
    const delta = a - b;
    if (delta <= -10) {
      return {
        id: 'roe-collapse',
        severity: 'high',
        category: 'profitability',
        title: 'ROE 급락',
        detail: `${b.toFixed(1)}% → ${a.toFixed(1)}% (${delta.toFixed(1)}%p)`,
      };
    }
    return null;
  },

  // ── 유동성 ──
  function currentRatioLow(d) {
    const cur = last(d.stability_data?.유동비율);
    if (cur === undefined) return null;
    if (cur < 80) {
      return {
        id: 'current-ratio-critical',
        severity: 'critical',
        category: 'liquidity',
        title: '유동비율 위험',
        detail: `${cur.toFixed(1)}% (80% 미만 = 단기 지급능력 부족)`,
      };
    }
    if (cur < 100) {
      return {
        id: 'current-ratio-low',
        severity: 'high',
        category: 'liquidity',
        title: '유동비율 100% 미만',
        detail: `${cur.toFixed(1)}%`,
      };
    }
    return null;
  },

  // ── 레버리지 ──
  function negativeEquity(d) {
    const eq = last(d.balance_sheet_data?.자본총계);
    if (eq === undefined || eq >= 0) return null;
    return {
      id: 'negative-equity',
      severity: 'critical',
      category: 'leverage',
      title: '자본잠식',
      detail: `자본총계 ${eq.toLocaleString('ko-KR')}억`,
    };
  },

  function debtSurge(d) {
    const a = last(d.stability_data?.부채비율);
    const b = prev(d.stability_data?.부채비율);
    if (a === undefined || b === undefined) return null;
    if (a - b >= 50) {
      return {
        id: 'debt-surge',
        severity: 'high',
        category: 'leverage',
        title: '부채비율 급증',
        detail: `${b.toFixed(1)}% → ${a.toFixed(1)}% (+${(a - b).toFixed(1)}%p)`,
      };
    }
    return null;
  },

  function debtHigh(d) {
    const a = last(d.stability_data?.부채비율);
    if (a === undefined) return null;
    if (a >= 400) {
      return {
        id: 'debt-extreme',
        severity: 'critical',
        category: 'leverage',
        title: '부채비율 심각',
        detail: `${a.toFixed(1)}% (400% 초과)`,
      };
    }
    if (a >= 200) {
      return {
        id: 'debt-high',
        severity: 'medium',
        category: 'leverage',
        title: '부채비율 높음',
        detail: `${a.toFixed(1)}%`,
      };
    }
    return null;
  },

  function interestCoverageLow(d) {
    const c = last(d.stability_data?.이자보상배율);
    if (c === undefined) return null;
    if (c < 1) {
      return {
        id: 'zombie-firm',
        severity: 'critical',
        category: 'leverage',
        title: '한계기업 위험',
        detail: `이자보상배율 ${c.toFixed(2)}배 (영업이익으로 이자 미상환)`,
      };
    }
    if (c < 1.5) {
      return {
        id: 'interest-cover-tight',
        severity: 'medium',
        category: 'leverage',
        title: '이자상환 여력 부족',
        detail: `${c.toFixed(2)}배`,
      };
    }
    return null;
  },

  // ── 효율성 ──
  function cccSurge(d) {
    const a = last(d.working_capital_data?.CCC);
    const b = prev(d.working_capital_data?.CCC);
    if (a === undefined || b === undefined) return null;
    if (a - b >= 30) {
      return {
        id: 'ccc-surge',
        severity: 'medium',
        category: 'efficiency',
        title: '운전자본 회전 둔화',
        detail: `CCC ${b.toFixed(0)}일 → ${a.toFixed(0)}일 (+${(a - b).toFixed(0)}일)`,
      };
    }
    return null;
  },

  function dsoSurge(d) {
    const a = last(d.working_capital_data?.DSO);
    const b = prev(d.working_capital_data?.DSO);
    if (a === undefined || b === undefined) return null;
    if (a - b >= 30) {
      return {
        id: 'dso-surge',
        severity: 'medium',
        category: 'efficiency',
        title: '매출채권 회수 지연',
        detail: `DSO ${b.toFixed(0)}일 → ${a.toFixed(0)}일`,
      };
    }
    return null;
  },

  // ── 현금 ──
  function fcfNegative(d) {
    const a = last(d.cash_flow_data?.FCF);
    if (a === undefined || a >= 0) return null;
    return {
      id: 'fcf-negative',
      severity: 'medium',
      category: 'cash',
      title: 'FCF 음수',
      detail: `${a.toLocaleString('ko-KR')}억 (잉여현금흐름 부족)`,
    };
  },

  function financingDependence(d) {
    const op = last(d.cash_flow_data?.영업활동);
    const fin = last(d.cash_flow_data?.재무활동);
    if (op === undefined || fin === undefined) return null;
    if (op < 0 && fin > 0) {
      return {
        id: 'financing-dependence',
        severity: 'high',
        category: 'cash',
        title: '재무활동 의존',
        detail: `영업CF ${op.toLocaleString('ko-KR')}억 · 재무CF +${fin.toLocaleString('ko-KR')}억 (외부 자금조달로 운영자금 충당)`,
      };
    }
    return null;
  },
];

export function detectRiskFlags(data: CompanyFinancialData): RiskFlag[] {
  const flags: RiskFlag[] = [];
  for (const rule of rules) {
    const flag = rule(data);
    if (flag) flags.push(flag);
  }
  const order: Record<RiskSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return flags.sort((a, b) => order[a.severity] - order[b.severity]);
}
