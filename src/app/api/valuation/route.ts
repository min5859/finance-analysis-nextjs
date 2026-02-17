import { NextResponse } from 'next/server';
import { z } from 'zod';
import { chatCompletion, type AIProvider } from '@/lib/ai-client';
import { extractJsonFromAIResponse } from '@/lib/parse-ai-response';
import { prisma } from '@/lib/prisma';

const valuationSchema = z.object({
  company_info: z.object({ corp_name: z.string(), sector: z.string().optional() }).passthrough(),
  financial_data: z.object({}).passthrough(),
  industry_info: z.object({}).passthrough().optional(),
  provider: z.enum(['anthropic', 'openai', 'gemini', 'deepseek']).optional(),
  analysis_id: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = valuationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: '유효하지 않은 요청입니다.', details: parsed.error.issues }, { status: 400 });
    }
    const { company_info, financial_data, industry_info, provider = 'anthropic' } = parsed.data;

    const userMessage = `
# 기업 정보
기업명: ${company_info?.corp_name || '알 수 없음'}
업종: ${company_info?.sector || '알 수 없음'}

# 재무 정보 (단위: 억원)
${JSON.stringify(financial_data, null, 2)}

${industry_info ? `산업 관련 정보: ${JSON.stringify(industry_info)}` : ''}

다음 형식으로 분석해주세요:
1. EBITDA와 DCF 두가지 방식으로 보수적, 기본, 낙관적 3가지로 기업가치를 평가
2. 결과는 JSON 구조로 출력:
{
  "company": "${company_info?.corp_name || ''}",
  "ebitda_valuation": { "conservative": 숫자, "base": 숫자, "optimistic": 숫자 },
  "dcf_valuation": { "conservative": 숫자, "base": 숫자, "optimistic": 숫자 },
  "assumptions": {
    "ebitda_multipliers": { "conservative": 숫자, "base": 숫자, "optimistic": 숫자 },
    "discount_rates": { "conservative": 숫자, "base": 숫자, "optimistic": 숫자 },
    "growth_rates": { "conservative": 숫자, "base": 숫자, "optimistic": 숫자 },
    "terminal_growth_rates": { "conservative": 숫자, "base": 숫자, "optimistic": 숫자 }
  },
  "calculations": { "ebitda_description": "설명", "dcf_description": "설명" },
  "summary": "종합 분석"
}
금액 단위는 억원으로 통일하세요.`;

    const { text: responseText, error } = await chatCompletion({
      provider: provider as AIProvider,
      system: '당신은 기업 가치 평가와 M&A 분석을 전문으로 하는 금융 애널리스트입니다.',
      userMessage,
      temperature: 0.2,
      maxTokens: 4000,
    });
    if (error) return error;

    const data = extractJsonFromAIResponse(responseText!);

    // DB에 밸류에이션 결과 저장 (analysis_id가 있는 경우)
    if (parsed.data.analysis_id) {
      try {
        await prisma.valuation.create({
          data: {
            analysisId: parsed.data.analysis_id,
            provider,
            result: data as object,
          },
        });
      } catch {
        // DB 저장 실패해도 결과는 반환
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
