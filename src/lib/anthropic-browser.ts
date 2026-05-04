// ⚠️ TEMPORARY — 보안 부채 보유 코드 ⚠️
//
// 이 모듈은 브라우저에서 Anthropic SDK 를 직접 호출한다. 즉, 사용자 PC 의
// JavaScript 가 ANTHROPIC_API_KEY 를 메모리에 로드한 채 Anthropic API 로
// 요청을 보낸다. DevTools 로 키 추출이 가능하다.
//
// 도입 사유: Vercel Hobby 60s timeout 우회. 자세한 내용은
// src/app/api/anthropic-config/route.ts 머리말 참조.

import Anthropic from '@anthropic-ai/sdk';

interface AnthropicConfig {
  apiKey: string;
  model: string;
  system: string;
}

interface ExtractParams extends AnthropicConfig {
  pdfBase64: string;
}

export async function fetchAnthropicConfig(): Promise<AnthropicConfig> {
  const res = await fetch('/api/anthropic-config');
  if (!res.ok) {
    if (res.status === 401) throw new Error('인증이 만료됐습니다. 다시 로그인해 주세요.');
    throw new Error(`설정 로드 실패 (HTTP ${res.status})`);
  }
  return (await res.json()) as AnthropicConfig;
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsDataURL(file);
  });
}

export async function extractFinanceFromPdfDirect({
  pdfBase64,
  apiKey,
  model,
  system,
}: ExtractParams): Promise<unknown> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.messages.create({
    model,
    max_tokens: 8192,
    temperature: 0.1,
    system,
    tools: [
      {
        name: 'extract_finance_data',
        description: 'Return the requested analysis as a structured JSON object.',
        input_schema: {
          type: 'object',
          additionalProperties: true,
        } as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: 'tool', name: 'extract_finance_data' },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
          },
          {
            type: 'text',
            text: '첨부된 PDF 사업보고서/재무제표를 분석하여 지정된 JSON 형식으로 변환해주세요. 스캔된 페이지가 있다면 OCR로 읽어주세요.',
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find(
    (c): c is Anthropic.ToolUseBlock => c.type === 'tool_use',
  );
  if (!toolUse) throw new Error('AI 응답에 structured output 이 없습니다');
  return toolUse.input;
}
