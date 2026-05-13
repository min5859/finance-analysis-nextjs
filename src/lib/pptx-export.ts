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
// 슬라이드 빌더 — 각 페이즈에서 채워 나갈 자리
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
  // Phase C/D 에서 슬라이드 추가 예정

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
