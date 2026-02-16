import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { getAnthropicClient, AI_MODEL, MAX_INPUT_CHARS } from '@/lib/anthropic-client';
import { extractJsonFromAIResponse } from '@/lib/parse-ai-response';

const extractSchema = z.object({
  text: z.string().min(1, '텍스트가 비어있습니다.'),
  type: z.enum(['pdf_text', 'dart_data', 'image_base64']).optional(),
  apiKey: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = extractSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: '유효하지 않은 요청입니다.', details: parsed.error.issues }, { status: 400 });
    }
    const { text, apiKey } = parsed.data;
    const { client, error } = getAnthropicClient(apiKey);
    if (error) return error;

    const promptPath = path.join(process.cwd(), 'src/data/prompt.txt');
    const templatePath = path.join(process.cwd(), 'src/data/finance_format.json');

    const prompt = fs.existsSync(promptPath) ? fs.readFileSync(promptPath, 'utf-8') : '';
    const template = fs.existsSync(templatePath) ? fs.readFileSync(templatePath, 'utf-8') : '{}';

    const response = await client.messages.create({
      model: AI_MODEL,
      system: `${prompt}\n\nJSON 템플릿:\n${template}`,
      messages: [{ role: 'user', content: `다음 재무제표 내용을 분석하여 지정된 JSON 형식으로 변환해주세요. 문서 내용: ${text?.substring(0, MAX_INPUT_CHARS) || ''}` }],
      temperature: 0.1,
      max_tokens: 8000,
    });

    const content = response.content[0];
    const responseText = content.type === 'text' ? content.text : '';
    const data = extractJsonFromAIResponse(responseText);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
