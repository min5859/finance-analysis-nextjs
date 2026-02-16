import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

export type AIProvider = 'anthropic' | 'deepseek';

export const MAX_INPUT_CHARS = 20_000;

const DEFAULT_MODELS: Record<AIProvider, string> = {
  anthropic: process.env.AI_MODEL || 'claude-sonnet-4-20250514',
  deepseek: 'deepseek-chat',
};

interface ChatCompletionParams {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  system: string;
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
}

export async function chatCompletion({
  provider,
  apiKey,
  model,
  system,
  userMessage,
  temperature = 0.2,
  maxTokens = 4000,
}: ChatCompletionParams): Promise<{ text: string | null; error: NextResponse | null }> {
  const resolvedModel = model || DEFAULT_MODELS[provider];

  if (provider === 'anthropic') {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return { text: null, error: NextResponse.json({ error: 'Anthropic API key required' }, { status: 401 }) };
    }
    const client = new Anthropic({ apiKey: key });
    const response = await client.messages.create({
      model: resolvedModel,
      system,
      messages: [{ role: 'user', content: userMessage }],
      temperature,
      max_tokens: maxTokens,
    });
    const content = response.content[0];
    return { text: content.type === 'text' ? content.text : '', error: null };
  }

  // DeepSeek (OpenAI-compatible)
  const key = apiKey || process.env.DEEPSEEK_API_KEY;
  if (!key) {
    return { text: null, error: NextResponse.json({ error: 'DeepSeek API key required' }, { status: 401 }) };
  }
  const client = new OpenAI({ apiKey: key, baseURL: 'https://api.deepseek.com' });
  const response = await client.chat.completions.create({
    model: resolvedModel,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userMessage },
    ],
    temperature,
    max_tokens: maxTokens,
  });
  return { text: response.choices[0].message.content ?? '', error: null };
}
