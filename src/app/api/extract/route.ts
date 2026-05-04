import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import {
  chatCompletionJson,
  MAX_INPUT_CHARS,
  PROVIDERS_WITH_PDF_INPUT,
  type AIProvider,
} from '@/lib/ai-client';
import { handleApiError } from '@/lib/api-error';

const MAX_PDF_SIZE = 32 * 1024 * 1024; // Anthropic document upload upper bound
const PROVIDERS = ['anthropic', 'openai', 'gemini', 'deepseek'] as const;

// Vercel: 기본 10초 → 비전 PDF 분석은 보통 30~60초. Hobby plan max 60s, Pro plan max 300s.
export const maxDuration = 60;

const jsonBodySchema = z.object({
  text: z.string().min(1, '텍스트가 비어있습니다.'),
  provider: z.enum(PROVIDERS).optional(),
});

function loadPromptAndTemplate() {
  const promptPath = path.join(process.cwd(), 'src/data/prompt.txt');
  const templatePath = path.join(process.cwd(), 'src/data/finance_format.json');
  const prompt = fs.existsSync(promptPath) ? fs.readFileSync(promptPath, 'utf-8') : '';
  const template = fs.existsSync(templatePath) ? fs.readFileSync(templatePath, 'utf-8') : '{}';
  return { prompt, template };
}

async function pdfToText(buffer: Buffer): Promise<string> {
  // Lazy import: pdf-parse는 pdfjs-dist를 통해 DOMMatrix 등 브라우저 globals를 요구하기 때문에
  // Vercel serverless 런타임에서 모듈 로드 자체가 실패할 수 있음. 동적 import로 미뤄서
  // PDF input을 native 지원하는 provider (Anthropic) 경로에서는 아예 호출되지 않게 함.
  const { PDFParse } = await import('pdf-parse');
  const pdf = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await pdf.getText();
  await pdf.destroy();
  return result.pages.map((p) => p.text).join('\n');
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Multipart path: PDF binary uploaded directly. Anthropic gets the PDF as-is;
    // other providers fall back to server-side text extraction via pdf-parse.
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      const providerRaw = formData.get('provider');
      const provider = (typeof providerRaw === 'string' && (PROVIDERS as readonly string[]).includes(providerRaw)
        ? providerRaw
        : 'anthropic') as AIProvider;

      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
      }
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        return NextResponse.json({ error: 'PDF 파일만 지원합니다.' }, { status: 400 });
      }
      if (file.size > MAX_PDF_SIZE) {
        return NextResponse.json({ error: `PDF 크기가 ${MAX_PDF_SIZE / 1024 / 1024}MB를 초과합니다.` }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const { prompt, template } = loadPromptAndTemplate();
      const system = `${prompt}\n\nJSON 템플릿:\n${template}`;

      if (PROVIDERS_WITH_PDF_INPUT.includes(provider)) {
        const { data, error } = await chatCompletionJson<object>({
          provider,
          system,
          userMessage: '첨부된 PDF 사업보고서/재무제표를 분석하여 지정된 JSON 형식으로 변환해주세요. 스캔된 페이지가 있다면 OCR로 읽어주세요.',
          temperature: 0.1,
          maxTokens: 8192,
          attachments: [{ kind: 'pdf', base64: buffer.toString('base64') }],
          toolName: 'extract_finance_data',
        });
        if (error) return error;
        if (!data) return NextResponse.json({ error: 'AI 응답이 비어있습니다.' }, { status: 500 });
        return NextResponse.json({ success: true, data });
      }

      // Fallback for providers without native PDF input: extract text server-side.
      let text: string;
      try {
        text = await pdfToText(buffer);
      } catch (err) {
        console.error('[API:extract] pdf-parse failed:', err);
        return NextResponse.json(
          { error: 'PDF 텍스트 추출에 실패했습니다 (서버 환경 호환성 이슈). OCR converting 옵션을 켜서 Anthropic으로 분석해 주세요.' },
          { status: 500 },
        );
      }
      if (!text.trim()) {
        return NextResponse.json(
          { error: 'PDF에서 텍스트를 추출할 수 없습니다 (스캔본 가능성). OCR converting 옵션을 켜서 Anthropic으로 다시 시도하세요.' },
          { status: 400 },
        );
      }
      const { data, error } = await chatCompletionJson<object>({
        provider,
        system,
        userMessage: `다음 PDF 텍스트를 분석하여 지정된 JSON 형식으로 변환해주세요. 문서 내용: ${text.substring(0, MAX_INPUT_CHARS)}`,
        temperature: 0.1,
        maxTokens: 8192,
        toolName: 'extract_finance_data',
      });
      if (error) return error;
      if (!data) return NextResponse.json({ error: 'AI 응답이 비어있습니다.' }, { status: 500 });
      return NextResponse.json({ success: true, data });
    }

    // JSON body path: pre-extracted text (e.g. DART optimized JSON).
    const body = await request.json();
    const parsed = jsonBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: '유효하지 않은 요청입니다.', details: parsed.error.issues }, { status: 400 });
    }
    const { text, provider = 'anthropic' } = parsed.data;
    const { prompt, template } = loadPromptAndTemplate();

    const { data, error } = await chatCompletionJson<object>({
      provider: provider as AIProvider,
      system: `${prompt}\n\nJSON 템플릿:\n${template}`,
      userMessage: `다음 재무제표 내용을 분석하여 지정된 JSON 형식으로 변환해주세요. 문서 내용: ${text.substring(0, MAX_INPUT_CHARS)}`,
      temperature: 0.1,
      maxTokens: 8192,
      toolName: 'extract_finance_data',
    });
    if (error) return error;
    if (!data) return NextResponse.json({ error: 'AI 응답이 비어있습니다.' }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err, 'extract');
  }
}
