import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

interface PdfOptions {
  companyName: string;
  title?: string;
}

export async function downloadPdf(
  element: HTMLElement,
  options: PdfOptions
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  const date = new Date().toLocaleDateString('ko-KR');
  const headerText = `${options.companyName} | ${date}`;

  // 한글 헤더를 Canvas API로 렌더링 (jsPDF 기본 폰트는 한글 미지원)
  const headerCanvas = document.createElement('canvas');
  const headerScale = 4;
  const headerWidthPx = Math.round(contentWidth * headerScale * 3.78); // mm → px
  const headerHeightPx = 24 * headerScale;
  headerCanvas.width = headerWidthPx;
  headerCanvas.height = headerHeightPx;
  const hctx = headerCanvas.getContext('2d')!;
  hctx.fillStyle = '#ffffff';
  hctx.fillRect(0, 0, headerWidthPx, headerHeightPx);
  hctx.font = `${10 * headerScale}px "Noto Sans KR", sans-serif`;
  hctx.fillStyle = '#666666';
  hctx.textBaseline = 'middle';
  hctx.fillText(headerText, 0, headerHeightPx / 2);
  const headerImg = headerCanvas.toDataURL('image/png');
  const headerMmHeight = 6;

  let yOffset = margin + headerMmHeight;
  let remainingHeight = imgHeight;
  let sourceY = 0;

  while (remainingHeight > 0) {
    const availableHeight = pageHeight - margin * 2 - headerMmHeight;
    const drawHeight = Math.min(remainingHeight, availableHeight);
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = Math.round((drawHeight / imgHeight) * canvas.height);
    const ctx = sliceCanvas.getContext('2d')!;
    ctx.drawImage(
      canvas,
      0, sourceY, canvas.width, sliceCanvas.height,
      0, 0, sliceCanvas.width, sliceCanvas.height
    );

    const sliceData = sliceCanvas.toDataURL('image/png');
    if (sourceY > 0) {
      pdf.addPage();
    }

    pdf.addImage(headerImg, 'PNG', margin, margin, contentWidth, headerMmHeight);
    pdf.addImage(sliceData, 'PNG', margin, yOffset, contentWidth, drawHeight);

    sourceY += sliceCanvas.height;
    remainingHeight -= drawHeight;
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  pdf.save(`${options.companyName}_report_${dateStr}.pdf`);
}

interface FullReportOptions extends PdfOptions {
  onProgress?: (current: number, total: number) => void;
}

function createHeaderImage(headerText: string, contentWidth: number) {
  const headerCanvas = document.createElement('canvas');
  const headerScale = 4;
  const headerWidthPx = Math.round(contentWidth * headerScale * 3.78);
  const headerHeightPx = 24 * headerScale;
  headerCanvas.width = headerWidthPx;
  headerCanvas.height = headerHeightPx;
  const hctx = headerCanvas.getContext('2d')!;
  hctx.fillStyle = '#ffffff';
  hctx.fillRect(0, 0, headerWidthPx, headerHeightPx);
  hctx.font = `${10 * headerScale}px "Noto Sans KR", sans-serif`;
  hctx.fillStyle = '#666666';
  hctx.textBaseline = 'middle';
  hctx.fillText(headerText, 0, headerHeightPx / 2);
  return headerCanvas.toDataURL('image/png');
}

function addCanvasToPdf(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  headerImg: string,
  isFirstPage: boolean,
) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const headerMmHeight = 6;
  const contentWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;
  const yOffset = margin + headerMmHeight;

  let remainingHeight = imgHeight;
  let sourceY = 0;
  let needsNewPage = !isFirstPage;

  while (remainingHeight > 0) {
    const availableHeight = pageHeight - margin * 2 - headerMmHeight;
    const drawHeight = Math.min(remainingHeight, availableHeight);
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = Math.round((drawHeight / imgHeight) * canvas.height);
    const ctx = sliceCanvas.getContext('2d')!;
    ctx.drawImage(
      canvas,
      0, sourceY, canvas.width, sliceCanvas.height,
      0, 0, sliceCanvas.width, sliceCanvas.height,
    );

    const sliceData = sliceCanvas.toDataURL('image/png');
    if (needsNewPage) {
      pdf.addPage();
    }
    needsNewPage = true;

    pdf.addImage(headerImg, 'PNG', margin, margin, contentWidth, headerMmHeight);
    pdf.addImage(sliceData, 'PNG', margin, yOffset, contentWidth, drawHeight);

    sourceY += sliceCanvas.height;
    remainingHeight -= drawHeight;
  }
}

export async function downloadFullReportPdf(
  container: HTMLElement,
  options: FullReportOptions,
): Promise<void> {
  const sectionEls = container.querySelectorAll<HTMLElement>('[data-section]');
  const total = sectionEls.length;
  if (total === 0) return;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  const date = new Date().toLocaleDateString('ko-KR');
  const headerText = `${options.companyName} 통합 리포트 | ${date}`;
  const headerImg = createHeaderImage(headerText, contentWidth);

  for (let i = 0; i < total; i++) {
    options.onProgress?.(i + 1, total);

    const canvas = await html2canvas(sectionEls[i], {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    addCanvasToPdf(pdf, canvas, headerImg, i === 0);
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  pdf.save(`${options.companyName}_full_report_${dateStr}.pdf`);
}
