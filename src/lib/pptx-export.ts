/**
 * CompanyFinancialData → PPTX 직접 생성.
 *
 * 설계 문서: docs/tasks/pptx-export.design.md
 *
 * 출력은 PowerPoint·Keynote 에서 그대로 열고 편집 가능한 네이티브
 * 슬라이드. 차트는 pptxgenjs 의 네이티브 차트 객체로 생성하므로
 * 사용자가 차트를 클릭해 데이터 셀을 직접 편집할 수 있다.
 */

import PptxGenJS from 'pptxgenjs';
import type { CompanyFinancialData } from '@/types/company';
import { COLOR_PALETTE } from '@/components/charts/chartConfig';
import {
  calculatePiotroskiFScore,
  detectDistressSignals,
} from '@/features/financial-analysis/health-scores';
import { detectRiskFlags } from '@/features/financial-analysis/risk-flags';
import { latest } from '@/lib/format';

// ────────────────────────────────────────────────────────────
// 색상 / 폰트 토큰 (pptxgenjs 는 hex 를 '#' 없이 받는다)
// ────────────────────────────────────────────────────────────

const stripHash = (hex: string): string => hex.replace(/^#/, '');

export const PPTX_COLORS = {
  primary: stripHash(COLOR_PALETTE.primary),
  secondary: stripHash(COLOR_PALETTE.secondary),
  success: stripHash(COLOR_PALETTE.success),
  warning: stripHash(COLOR_PALETTE.warning),
  danger: stripHash(COLOR_PALETTE.danger),
  info: stripHash(COLOR_PALETTE.info),
  muted: stripHash(COLOR_PALETTE.muted),
  dark: stripHash(COLOR_PALETTE.dark),
  headerFrom: stripHash(COLOR_PALETTE.headerFrom),
  white: 'FFFFFF',
  bgLight: 'F3F4F6',
  border: 'E5E7EB',
} as const;

export const PPTX_SERIES_COLORS = [
  PPTX_COLORS.primary,
  PPTX_COLORS.success,
  PPTX_COLORS.warning,
  PPTX_COLORS.danger,
  PPTX_COLORS.secondary,
  PPTX_COLORS.info,
];

const FONT = 'Noto Sans KR';

// 16:9 wide 슬라이드 (13.33 × 7.5 in)
const SLIDE_W = 13.33;
const SLIDE_H = 7.5;
const MARGIN = 0.5;

// ────────────────────────────────────────────────────────────
// 슬라이드 마스터: 좌상단 회사명, 우상단 연도, 하단 페이지 번호
// ────────────────────────────────────────────────────────────

interface MasterContext {
  companyName: string;
  reportYear: string;
}

function defineMaster(pptx: PptxGenJS, ctx: MasterContext) {
  pptx.defineSlideMaster({
    title: 'BASE',
    background: { color: PPTX_COLORS.white },
    objects: [
      {
        rect: {
          x: 0,
          y: 0,
          w: SLIDE_W,
          h: 0.05,
          fill: { color: PPTX_COLORS.headerFrom },
        },
      },
      {
        text: {
          text: ctx.companyName,
          options: {
            x: MARGIN,
            y: 0.12,
            w: SLIDE_W - MARGIN * 2,
            h: 0.3,
            fontSize: 10,
            fontFace: FONT,
            color: PPTX_COLORS.muted,
            align: 'left',
          },
        },
      },
      {
        text: {
          text: ctx.reportYear,
          options: {
            x: MARGIN,
            y: 0.12,
            w: SLIDE_W - MARGIN * 2,
            h: 0.3,
            fontSize: 10,
            fontFace: FONT,
            color: PPTX_COLORS.muted,
            align: 'right',
          },
        },
      },
    ],
    slideNumber: {
      x: SLIDE_W - MARGIN - 0.5,
      y: SLIDE_H - 0.35,
      w: 0.5,
      h: 0.25,
      fontSize: 9,
      fontFace: FONT,
      color: PPTX_COLORS.muted,
      align: 'right',
    },
  });
}

// ────────────────────────────────────────────────────────────
// 공용 헬퍼
// ────────────────────────────────────────────────────────────

type Slide = ReturnType<PptxGenJS['addSlide']>;

function slideTitle(slide: Slide, title: string) {
  slide.addText(title, {
    x: MARGIN,
    y: 0.5,
    w: SLIDE_W - MARGIN * 2,
    h: 0.6,
    fontSize: 22,
    bold: true,
    fontFace: FONT,
    color: PPTX_COLORS.dark,
  });
}

function metricCard(slide: Slide, x: number, y: number, w: number, h: number,
                    label: string, value: string, accent = PPTX_COLORS.primary) {
  slide.addShape('roundRect', {
    x, y, w, h,
    line: { color: PPTX_COLORS.border, width: 0.5 },
    fill: { color: PPTX_COLORS.white },
    rectRadius: 0.05,
  });
  slide.addText(label, {
    x: x + 0.15, y: y + 0.1, w: w - 0.3, h: 0.3,
    fontSize: 10, fontFace: FONT, color: PPTX_COLORS.muted,
  });
  slide.addText(value, {
    x: x + 0.15, y: y + 0.4, w: w - 0.3, h: h - 0.5,
    fontSize: 18, bold: true, fontFace: FONT, color: accent,
  });
}

function dataTable(
  slide: Slide,
  x: number,
  y: number,
  w: number,
  h: number,
  header: string[],
  rows: (string | number)[][],
) {
  const headerRow = header.map((h) => ({
    text: h,
    options: {
      bold: true,
      color: PPTX_COLORS.white,
      fill: { color: PPTX_COLORS.headerFrom },
      align: 'center' as const,
      fontFace: FONT,
      fontSize: 10,
    },
  }));
  const bodyRows = rows.map((r, i) =>
    r.map((cell, ci) => ({
      text: String(cell),
      options: {
        align: (ci === 0 ? 'left' : 'right') as 'left' | 'right',
        fill: { color: i % 2 === 0 ? PPTX_COLORS.white : PPTX_COLORS.bgLight },
        fontFace: FONT,
        fontSize: 10,
        color: PPTX_COLORS.dark,
      },
    })),
  );
  slide.addTable([headerRow, ...bodyRows], { x, y, w, h, border: { type: 'solid', pt: 0.5, color: PPTX_COLORS.border } });
}

/** 연도 헤더 + 지표 행들 (단위 접미사 옵션) → 표 셀 2차원. */
function buildSeriesRows(
  year: string[],
  series: Record<string, number[]>,
  decimals = 1,
): { header: string[]; rows: (string | number)[][] } {
  const header = ['지표', ...year];
  const rows = Object.entries(series).map(([k, arr]) => [
    k,
    ...year.map((_, i) => {
      const v = arr?.[i];
      if (v === undefined || v === null) return '-';
      return decimals === 0 ? Math.round(v).toLocaleString('ko-KR') : v.toFixed(decimals);
    }),
  ]);
  return { header, rows };
}

// ────────────────────────────────────────────────────────────
// 슬라이드 빌더
// ────────────────────────────────────────────────────────────

function addTitleSlide(pptx: PptxGenJS, data: CompanyFinancialData) {
  const slide = pptx.addSlide({ masterName: 'BASE' });

  slide.addText(data.company_name || '회사명 없음', {
    x: MARGIN,
    y: 2.5,
    w: SLIDE_W - MARGIN * 2,
    h: 1.2,
    fontSize: 44,
    bold: true,
    fontFace: FONT,
    color: PPTX_COLORS.dark,
    align: 'center',
  });

  const sub = [data.sector, data.report_year ? `${data.report_year}년 보고서` : null]
    .filter(Boolean)
    .join(' · ');
  if (sub) {
    slide.addText(sub, {
      x: MARGIN,
      y: 3.8,
      w: SLIDE_W - MARGIN * 2,
      h: 0.5,
      fontSize: 18,
      fontFace: FONT,
      color: PPTX_COLORS.muted,
      align: 'center',
    });
  }

  const today = new Date();
  slide.addText(
    `생성일: ${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
    {
      x: MARGIN,
      y: SLIDE_H - 1.2,
      w: SLIDE_W - MARGIN * 2,
      h: 0.4,
      fontSize: 11,
      fontFace: FONT,
      color: PPTX_COLORS.muted,
      align: 'center',
    },
  );
}

function addSummarySlide(pptx: PptxGenJS, data: CompanyFinancialData) {
  const slide = pptx.addSlide({ masterName: 'BASE' });
  slideTitle(slide, '요약');

  const perf = data.performance_data;
  const stab = data.stability_data;
  const prof = data.profitability_data;
  const cf = data.cash_flow_data;

  // 메트릭 카드 6장 (2행 × 3열)
  const cardW = 3.95;
  const cardH = 1.0;
  const startX = MARGIN;
  const startY = 1.3;
  const gapX = 0.15;
  const gapY = 0.15;
  const fmtBillion = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}억`;
  const fmtPct = (n: number) => `${n.toFixed(1)}%`;

  const cards = [
    { label: '매출액', value: fmtBillion(latest(perf?.매출액 ?? [])), accent: PPTX_COLORS.primary },
    { label: '영업이익', value: fmtBillion(latest(perf?.영업이익 ?? [])), accent: PPTX_COLORS.primary },
    { label: 'ROE', value: fmtPct(latest(prof?.ROE ?? [])), accent: PPTX_COLORS.success },
    { label: '부채비율', value: fmtPct(latest(stab?.부채비율 ?? [])), accent: PPTX_COLORS.warning },
    { label: '유동비율', value: fmtPct(latest(stab?.유동비율 ?? [])), accent: PPTX_COLORS.success },
    { label: '영업CF', value: fmtBillion(latest(cf?.영업활동 ?? [])), accent: PPTX_COLORS.primary },
  ];
  cards.forEach((c, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    metricCard(
      slide,
      startX + col * (cardW + gapX),
      startY + row * (cardH + gapY),
      cardW,
      cardH,
      c.label,
      c.value,
      c.accent,
    );
  });

  // F-Score + 부실 신호 라벨 + 위험 신호 카운트
  const fScore = calculatePiotroskiFScore(data);
  const distress = detectDistressSignals(data);
  const risks = detectRiskFlags(data);

  const distressLabel: Record<typeof distress.level, string> = {
    safe: '안전',
    watch: '관찰',
    danger: '위험',
  };
  const distressColor: Record<typeof distress.level, string> = {
    safe: PPTX_COLORS.success,
    watch: PPTX_COLORS.warning,
    danger: PPTX_COLORS.danger,
  };

  const cardY = startY + 2 * (cardH + gapY) + 0.2;
  metricCard(slide, startX, cardY, cardW, cardH, 'Piotroski F-Score',
    `${fScore.score} / ${fScore.max}`, PPTX_COLORS.primary);
  metricCard(slide, startX + cardW + gapX, cardY, cardW, cardH, '부실 신호',
    distressLabel[distress.level], distressColor[distress.level]);
  metricCard(slide, startX + 2 * (cardW + gapX), cardY, cardW, cardH, '자동 점검 — 위험 신호',
    `${risks.length}건`, risks.length === 0 ? PPTX_COLORS.success : PPTX_COLORS.danger);
}

function addStatementSlide(
  pptx: PptxGenJS,
  title: string,
  header: string[],
  rows: (string | number)[][],
  insight?: string,
) {
  const slide = pptx.addSlide({ masterName: 'BASE' });
  slideTitle(slide, title);

  // 좌측 표 (5 in 폭), 우측은 Phase D 에서 차트가 들어올 자리.
  dataTable(slide, MARGIN, 1.3, 5.0, 4.0, header, rows);

  if (insight) {
    slide.addText(insight, {
      x: MARGIN,
      y: 5.5,
      w: SLIDE_W - MARGIN * 2,
      h: 1.5,
      fontSize: 11,
      fontFace: FONT,
      color: PPTX_COLORS.dark,
      valign: 'top',
    });
  }
}

function addConclusionSlide(pptx: PptxGenJS, data: CompanyFinancialData) {
  const slide = pptx.addSlide({ masterName: 'BASE' });
  slideTitle(slide, '종합 결론');

  const c = data.conclusion;
  if (!c) {
    slide.addText('결론 데이터 없음.', {
      x: MARGIN, y: 1.3, w: SLIDE_W - MARGIN * 2, h: 0.5,
      fontSize: 14, fontFace: FONT, color: PPTX_COLORS.muted,
    });
    return;
  }

  const colW = 4.0;
  const colH = 5.5;
  const startY = 1.3;

  const renderColumn = (x: number, title: string, items: string[], accent: string) => {
    slide.addShape('rect', {
      x, y: startY, w: colW, h: 0.45,
      fill: { color: accent }, line: { color: accent },
    });
    slide.addText(title, {
      x: x + 0.1, y: startY + 0.05, w: colW - 0.2, h: 0.35,
      fontSize: 14, bold: true, fontFace: FONT, color: PPTX_COLORS.white,
    });
    slide.addText(
      items.map((t) => ({ text: t, options: { bullet: { type: 'bullet' } } })),
      {
        x, y: startY + 0.55, w: colW, h: colH - 0.55,
        fontSize: 11, fontFace: FONT, color: PPTX_COLORS.dark,
        paraSpaceAfter: 6, valign: 'top',
      },
    );
  };

  const strengthTexts = (c.strengths ?? []).map((s) => `${s.title}: ${s.description}`);
  const weaknessTexts = (c.weaknesses ?? []).map((w) => `${w.title}: ${w.description}`);
  const recoTexts = (c.strategic_recommendations ?? []).flatMap((r) => [
    `${r.title}`,
    ...(r.items ?? []).map((it) => `  · ${it}`),
  ]);

  renderColumn(MARGIN, '강점', strengthTexts, PPTX_COLORS.success);
  renderColumn(MARGIN + colW + 0.3, '약점', weaknessTexts, PPTX_COLORS.danger);
  renderColumn(MARGIN + (colW + 0.3) * 2, '전략 추천', recoTexts, PPTX_COLORS.primary);
}

function addAllStatementSlides(pptx: PptxGenJS, data: CompanyFinancialData) {
  const ins = data.insights ?? {};

  if (data.performance_data?.year?.length) {
    const pd = data.performance_data;
    const yr = pd.year;
    const { header, rows } = buildSeriesRows(yr, {
      매출액: pd.매출액,
      영업이익: pd.영업이익,
      순이익: pd.순이익,
    }, 0);
    const insight = ins.income_statement?.content1 ?? '';
    addStatementSlide(pptx, '손익계산서 (억원)', header, rows, insight);

    if (pd.영업이익률?.length || pd.순이익률?.length) {
      const ratio = buildSeriesRows(yr, {
        영업이익률: pd.영업이익률,
        순이익률: pd.순이익률,
      }, 1);
      addStatementSlide(pptx, '이익률 추이 (%)', ratio.header, ratio.rows);
    }
  }

  if (data.balance_sheet_data?.year?.length) {
    const yr = data.balance_sheet_data.year;
    const { header, rows } = buildSeriesRows(yr, {
      총자산: data.balance_sheet_data.총자산,
      총부채: data.balance_sheet_data.총부채,
      자본총계: data.balance_sheet_data.자본총계,
    }, 0);
    addStatementSlide(pptx, '재무상태표 (억원)', header, rows, ins.balance_sheet?.content1);
  }

  if (data.growth_rates?.year?.length) {
    const yr = data.growth_rates.year;
    const { header, rows } = buildSeriesRows(yr, {
      총자산성장률: data.growth_rates.총자산성장률,
      매출액성장률: data.growth_rates.매출액성장률,
      순이익성장률: data.growth_rates.순이익성장률,
    }, 1);
    addStatementSlide(pptx, '성장성 분석 (%)', header, rows, ins.growth_rates?.content1);
  }

  if (data.profitability_data?.year?.length) {
    const yr = data.profitability_data.year;
    const { header, rows } = buildSeriesRows(yr, {
      ROE: data.profitability_data.ROE,
      ROA: data.profitability_data.ROA,
      영업이익률: data.profitability_data.영업이익률,
      순이익률: data.profitability_data.순이익률,
    }, 1);
    addStatementSlide(pptx, '수익성 분석 (%)', header, rows, ins.profitability?.content1);
  }

  if (data.stability_data?.year?.length) {
    const yr = data.stability_data.year;
    const { header, rows } = buildSeriesRows(yr, {
      부채비율: data.stability_data.부채비율,
      유동비율: data.stability_data.유동비율,
      이자보상배율: data.stability_data.이자보상배율,
    }, 1);
    addStatementSlide(pptx, '안정성 분석', header, rows, ins.stability?.content1);
  }

  if (data.cash_flow_data?.year?.length) {
    const yr = data.cash_flow_data.year;
    const cf = data.cash_flow_data;
    const series: Record<string, number[]> = {
      영업활동: cf.영업활동,
      투자활동: cf.투자활동,
      FCF: cf.FCF,
    };
    if (cf.재무활동) series.재무활동 = cf.재무활동;
    const { header, rows } = buildSeriesRows(yr, series, 0);
    addStatementSlide(pptx, '현금흐름 (억원)', header, rows, ins.cash_flow?.content1);
  }

  if (data.working_capital_data?.year?.length) {
    const yr = data.working_capital_data.year;
    const { header, rows } = buildSeriesRows(yr, {
      DSO: data.working_capital_data.DSO,
      DIO: data.working_capital_data.DIO,
      DPO: data.working_capital_data.DPO,
      CCC: data.working_capital_data.CCC,
    }, 1);
    addStatementSlide(pptx, '운전자본 효율성 (일)', header, rows, ins.working_capital?.content1);
  }
}

// ────────────────────────────────────────────────────────────
// public API
// ────────────────────────────────────────────────────────────

export async function buildCompanyPptx(data: CompanyFinancialData): Promise<Blob> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = `${data.company_name} 재무 분석`;
  pptx.author = 'Financial Analysis System';

  defineMaster(pptx, {
    companyName: data.company_name || '',
    reportYear: data.report_year ? `${data.report_year}년 보고서` : '',
  });

  addTitleSlide(pptx, data);
  addSummarySlide(pptx, data);
  addAllStatementSlides(pptx, data);
  addConclusionSlide(pptx, data);
  // Phase D: 위 슬라이드들에 차트가 추가될 예정

  // writeFile 은 자동 다운로드. write({ outputType: 'blob' }) 는 Blob 반환.
  const blob = (await pptx.write({ outputType: 'blob' })) as Blob;
  return blob;
}

export async function downloadCompanyPptx(data: CompanyFinancialData): Promise<void> {
  const blob = await buildCompanyPptx(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  a.href = url;
  a.download = `${data.company_name || 'company'}_${dateStr}.pptx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
