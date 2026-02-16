# PDF Download Design Document

> **Summary**: 재무 분석 결과를 PDF로 다운로드하는 기능의 상세 설계
>
> **Project**: Financial Analysis Dashboard (frontend)
> **Version**: 0.1.0
> **Author**: AI
> **Date**: 2026-02-16
> **Status**: Draft
> **Planning Doc**: [pdf-download.plan.md](../../01-plan/features/pdf-download.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- 현재 대시보드 페이지의 DOM을 그대로 캡처하여 PDF로 변환
- 개별 페이지 다운로드 + 전체 통합 리포트 다운로드 지원
- Chart.js 차트가 포함된 상태로 PDF 생성
- 서버 의존 없이 클라이언트 사이드에서 완결

### 1.2 Design Principles

- 기존 페이지 컴포넌트를 수정하지 않고, 외부에서 캡처하는 방식
- PDF 생성 로직을 `src/lib/pdf-generator.ts`에 집중하여 단일 책임
- Header에 다운로드 버튼을 배치하여 모든 페이지에서 접근 가능

---

## 2. Architecture

### 2.1 Component Diagram

```
┌──────────────────────────────────────────────────┐
│  Browser (Client Side)                           │
│                                                  │
│  ┌──────────┐    ┌───────────────┐               │
│  │ Header   │───▶│ pdf-generator │               │
│  │ (Button) │    │               │               │
│  └──────────┘    │ html2canvas   │──▶ PDF File   │
│                  │ + jsPDF       │   (Download)   │
│  ┌──────────┐    │               │               │
│  │ Dashboard │──▶│ (DOM capture) │               │
│  │ Pages    │    └───────────────┘               │
│  └──────────┘                                    │
└──────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
사용자 클릭
  → Header의 다운로드 버튼
  → pdf-generator 호출
  → html2canvas로 대상 DOM (#pdf-content) 캡처
  → Canvas → PNG 이미지 변환
  → jsPDF에 이미지 삽입
  → PDF 파일 자동 다운로드
```

### 2.3 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `html2canvas` | ^1.4.1 | DOM → Canvas 캡처 |
| `jspdf` | ^2.5.2 | Canvas → PDF 생성 |

---

## 3. Data Model

### 3.1 PDF Options Interface

```typescript
interface PdfOptions {
  /** 회사명 (파일명 및 헤더에 사용) */
  companyName: string;
  /** PDF 페이지 제목 */
  title?: string;
}
```

새로운 엔티티나 DB 스키마 없음. 기존 `CompanyFinancialData`를 그대로 활용.

---

## 4. API Specification

API 엔드포인트 없음. 클라이언트 사이드 전용 기능.

---

## 5. UI/UX Design

### 5.1 Header 레이아웃 변경

```
변경 전:
┌────────────────────────────────────────────────────┐
│              {회사명} 재무 분석                      │
└────────────────────────────────────────────────────┘

변경 후:
┌────────────────────────────────────────────────────┐
│              {회사명} 재무 분석        [PDF 다운로드]│
└────────────────────────────────────────────────────┘
```

- 버튼 위치: Header 우측
- 버튼 스타일: 흰색 텍스트/테두리, 호버 시 반전
- 로딩 상태: "생성 중..." 텍스트 + 비활성화
- 회사 데이터 미로드 시: 버튼 숨김

### 5.2 User Flow

```
1. 사이드바에서 기업 선택 → 데이터 로드
2. 대시보드 페이지 탐색
3. Header의 [PDF 다운로드] 클릭
4. 현재 페이지가 PDF로 캡처됨
5. "{회사명}_report_{YYYYMMDD}.pdf" 자동 다운로드
```

### 5.3 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `Header` | `src/components/layout/Header.tsx` | PDF 다운로드 버튼 UI, 클릭 핸들러 |
| `pdf-generator` | `src/lib/pdf-generator.ts` | DOM 캡처 → PDF 변환 로직 |

---

## 6. Detailed Implementation

### 6.1 `src/lib/pdf-generator.ts`

```typescript
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PdfOptions {
  companyName: string;
  title?: string;
}

/**
 * 지정된 DOM 요소를 캡처하여 PDF로 다운로드
 * @param element - 캡처할 DOM 요소
 * @param options - PDF 옵션 (회사명, 제목)
 */
export async function downloadPdf(
  element: HTMLElement,
  options: PdfOptions
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,            // 고해상도
    useCORS: true,       // 외부 이미지 허용
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  // 헤더: 회사명 + 날짜
  const date = new Date().toLocaleDateString('ko-KR');
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text(`${options.companyName} | ${date}`, margin, 7);

  // 이미지 삽입 (여러 페이지 처리)
  let yOffset = margin + 2;
  let remainingHeight = imgHeight;
  let sourceY = 0;

  while (remainingHeight > 0) {
    const drawHeight = Math.min(remainingHeight, pageHeight - margin * 2 - 2);
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = (drawHeight / imgHeight) * canvas.height;
    const ctx = sliceCanvas.getContext('2d')!;
    ctx.drawImage(
      canvas,
      0, sourceY, canvas.width, sliceCanvas.height,
      0, 0, sliceCanvas.width, sliceCanvas.height
    );

    const sliceData = sliceCanvas.toDataURL('image/png');
    if (sourceY > 0) {
      pdf.addPage();
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`${options.companyName} | ${date}`, margin, 7);
      yOffset = margin + 2;
    }
    pdf.addImage(sliceData, 'PNG', margin, yOffset, contentWidth, drawHeight);

    sourceY += sliceCanvas.height;
    remainingHeight -= drawHeight;
  }

  // 파일 다운로드
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  pdf.save(`${options.companyName}_report_${dateStr}.pdf`);
}
```

### 6.2 `src/components/layout/Header.tsx` 변경

```typescript
'use client';

import { useState } from 'react';
import { useCompanyStore } from '@/store/company-store';
import { downloadPdf } from '@/lib/pdf-generator';

export default function Header() {
  const companyData = useCompanyStore((s) => s.companyData);
  const companyName = companyData?.company_name || '기업 재무';
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    const content = document.getElementById('pdf-content');
    if (!content) return;
    setIsGenerating(true);
    try {
      await downloadPdf(content, { companyName });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#0a1172] via-[#1a237e] to-[#283593] px-6 py-5 rounded-xl shadow-lg mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-extrabold text-white drop-shadow-md">
        {companyName} 재무 분석
      </h1>
      {companyData && (
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="text-sm text-white border border-white/50 px-4 py-1.5 rounded-lg hover:bg-white/10 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? '생성 중...' : 'PDF 다운로드'}
        </button>
      )}
    </div>
  );
}
```

### 6.3 `src/app/layout.tsx` 변경

`<main>` 내부의 `{children}`을 `id="pdf-content"`로 감싸서 캡처 대상 지정:

```tsx
<main className="flex-1 p-6 overflow-auto">
  <Header />
  <div id="pdf-content">
    {children}
  </div>
</main>
```

---

## 7. Error Handling

| Scenario | Handling |
|----------|----------|
| `#pdf-content` 요소 없음 | 버튼 클릭 무시 (early return) |
| html2canvas 캡처 실패 | try-catch → console.error, 사용자에게 알림 불필요 (드문 케이스) |
| 회사 데이터 미로드 | 버튼 자체를 숨김 (`companyData && ...`) |

---

## 8. Test Plan

### 8.1 Test Cases

- [ ] 기업 데이터 로드 후 PDF 다운로드 버튼 표시 확인
- [ ] 데이터 미로드 시 버튼 숨김 확인
- [ ] 차트가 포함된 페이지 (예: growth-rate) PDF 생성 확인
- [ ] 텍스트 전용 페이지 (예: conclusion) PDF 생성 확인
- [ ] 긴 페이지가 여러 PDF 페이지로 분할되는지 확인
- [ ] 한글 텍스트 깨짐 없는지 확인
- [ ] `npm run build` 성공 확인

---

## 9. Implementation Order

1. [ ] `npm install html2canvas jspdf` — 패키지 설치
2. [ ] `src/lib/pdf-generator.ts` — PDF 생성 유틸리티 작성
3. [ ] `src/app/layout.tsx` — `#pdf-content` wrapper div 추가
4. [ ] `src/components/layout/Header.tsx` — 다운로드 버튼 추가
5. [ ] `npm run build` — 빌드 검증

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-16 | Initial draft | AI |
