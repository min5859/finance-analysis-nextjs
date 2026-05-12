/**
 * AI provider 가격표 (USD / 1M tokens). 단가는 공식 가격 페이지 기준의 근사치이며
 * 모델 버전이 다르면 약간씩 다를 수 있다. 정확한 청구액이 아니라 대략적인
 * 사용량 가시화·일일 한도 가드 용도.
 *
 * - Anthropic: claude-sonnet-4 기준. opus 는 5배.
 * - OpenAI: gpt-4o 기준.
 * - Gemini: 2.0-flash 기준 (free-tier 일 수도 있으나 보수적으로 책정).
 * - DeepSeek: deepseek-chat (V3) 기준.
 */

interface ModelPrice {
  inputPer1M: number;
  outputPer1M: number;
}

const PRICING: Record<string, ModelPrice> = {
  // Anthropic
  'claude-opus-4-7': { inputPer1M: 15, outputPer1M: 75 },
  'claude-opus-4-5': { inputPer1M: 15, outputPer1M: 75 },
  'claude-opus': { inputPer1M: 15, outputPer1M: 75 },
  'claude-sonnet-4': { inputPer1M: 3, outputPer1M: 15 },
  'claude-sonnet': { inputPer1M: 3, outputPer1M: 15 },
  'claude-haiku-4-5': { inputPer1M: 1, outputPer1M: 5 },
  'claude-haiku': { inputPer1M: 1, outputPer1M: 5 },

  // OpenAI
  'gpt-4o': { inputPer1M: 2.5, outputPer1M: 10 },
  'gpt-4-turbo': { inputPer1M: 10, outputPer1M: 30 },
  'gpt-4': { inputPer1M: 30, outputPer1M: 60 },
  'gpt-3.5-turbo': { inputPer1M: 0.5, outputPer1M: 1.5 },

  // Gemini
  'gemini-2.0-flash': { inputPer1M: 0.1, outputPer1M: 0.4 },
  'gemini-1.5-pro': { inputPer1M: 1.25, outputPer1M: 5 },
  'gemini-1.5-flash': { inputPer1M: 0.075, outputPer1M: 0.3 },

  // DeepSeek
  'deepseek-chat': { inputPer1M: 0.27, outputPer1M: 1.1 },
  'deepseek-reasoner': { inputPer1M: 0.55, outputPer1M: 2.19 },
};

const DEFAULTS_BY_PROVIDER: Record<string, ModelPrice> = {
  anthropic: { inputPer1M: 3, outputPer1M: 15 },
  openai: { inputPer1M: 2.5, outputPer1M: 10 },
  gemini: { inputPer1M: 0.1, outputPer1M: 0.4 },
  deepseek: { inputPer1M: 0.27, outputPer1M: 1.1 },
};

function lookupPrice(provider: string, model: string | null | undefined): ModelPrice {
  if (model) {
    const lower = model.toLowerCase();
    if (PRICING[lower]) return PRICING[lower];
    // model 이름이 'claude-sonnet-4-20250514' 같은 datestamped 형식이면 prefix 매칭
    const prefix = Object.keys(PRICING)
      .filter((k) => lower.startsWith(k))
      .sort((a, b) => b.length - a.length)[0];
    if (prefix) return PRICING[prefix];
  }
  return DEFAULTS_BY_PROVIDER[provider] ?? { inputPer1M: 1, outputPer1M: 3 };
}

export function estimateCostUsd(
  provider: string,
  model: string | null | undefined,
  inputTokens: number,
  outputTokens: number,
): number {
  const price = lookupPrice(provider, model);
  return (inputTokens / 1_000_000) * price.inputPer1M + (outputTokens / 1_000_000) * price.outputPer1M;
}
