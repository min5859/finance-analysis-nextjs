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

  let yOffset = margin + 2;
  let remainingHeight = imgHeight;
  let sourceY = 0;

  while (remainingHeight > 0) {
    const availableHeight = pageHeight - margin * 2 - 2;
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

    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(headerText, margin, 7);
    pdf.addImage(sliceData, 'PNG', margin, yOffset, contentWidth, drawHeight);

    sourceY += sliceCanvas.height;
    remainingHeight -= drawHeight;
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  pdf.save(`${options.companyName}_report_${dateStr}.pdf`);
}
