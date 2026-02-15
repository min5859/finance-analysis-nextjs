import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

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
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    
    if (!key) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const promptPath = path.join(process.cwd(), 'src/data/prompt.txt');
    const templatePath = path.join(process.cwd(), 'src/data/finance_format.json');
    
    const prompt = fs.existsSync(promptPath) ? fs.readFileSync(promptPath, 'utf-8') : '';
    const template = fs.existsSync(templatePath) ? fs.readFileSync(templatePath, 'utf-8') : '{}';

    const client = new Anthropic({ apiKey: key });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      system: `${prompt}\n\nJSON 템플릿:\n${template}`,
      messages: [{ role: 'user', content: `다음 재무제표 내용을 분석하여 지정된 JSON 형식으로 변환해주세요. 문서 내용: ${text?.substring(0, 20000) || ''}` }],
      temperature: 0.1,
      max_tokens: 8000,
    });

    const content = response.content[0];
    let jsonStr = content.type === 'text' ? content.text : '';

    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
    }

    const data = JSON.parse(jsonStr);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
