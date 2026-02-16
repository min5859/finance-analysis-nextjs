import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import { detectFinancialPages, type PageInfo } from '@/lib/financial-page-detector';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기가 10MB를 초과합니다.' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // JSON 파일 처리
    if (file.name.endsWith('.json')) {
      const text = buffer.toString('utf-8');
      const data = JSON.parse(text);
      return NextResponse.json({ type: 'json', data });
    }

    // PDF 파일 처리
    if (file.name.endsWith('.pdf')) {
      const pdf = new PDFParse({ data: new Uint8Array(buffer) });
      const textResult = await pdf.getText();
      await pdf.destroy();

      const pages: PageInfo[] = textResult.pages.map((p) => ({
        pageNumber: p.num,
        text: p.text,
      }));

      const detection = detectFinancialPages(pages);

      return NextResponse.json({
        type: 'pdf',
        text: detection.extractedText,
        detectedPages: detection.detectedPages,
        totalPages: detection.totalPages,
      });
    }

    return NextResponse.json(
      { error: 'PDF 또는 JSON 파일만 지원합니다.' },
      { status: 400 },
    );
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
