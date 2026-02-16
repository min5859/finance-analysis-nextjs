import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { chatCompletion, MAX_INPUT_CHARS, type AIProvider } from '@/lib/ai-client';
import { extractJsonFromAIResponse } from '@/lib/parse-ai-response';

const extractSchema = z.object({
  text: z.string().min(1, '텍스트가 비어있습니다.'),
  type: z.enum(['pdf_text', 'dart_data', 'image_base64']).optional(),
  apiKey: z.string().optional(),
  provider: z.enum(['anthropic', 'openai', 'deepseek']).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = extractSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: '유효하지 않은 요청입니다.', details: parsed.error.issues }, { status: 400 });
    }
    const { text, apiKey, provider = 'anthropic' } = parsed.data;

    const promptPath = path.join(process.cwd(), 'src/data/prompt.txt');
    const templatePath = path.join(process.cwd(), 'src/data/finance_format.json');

    const prompt = fs.existsSync(promptPath) ? fs.readFileSync(promptPath, 'utf-8') : '';
    const template = fs.existsSync(templatePath) ? fs.readFileSync(templatePath, 'utf-8') : '{}';

    const { text: responseText, error } = await chatCompletion({
      provider: provider as AIProvider,
      apiKey,
      system: `${prompt}\n\nJSON 템플릿:\n${template}`,
      userMessage: `다음 재무제표 내용을 분석하여 지정된 JSON 형식으로 변환해주세요. 문서 내용: ${text?.substring(0, MAX_INPUT_CHARS) || ''}`,
      temperature: 0.1,
      maxTokens: 8000,
    });
    if (error) return error;

    const data = extractJsonFromAIResponse(responseText!);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
