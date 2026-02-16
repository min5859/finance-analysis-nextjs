import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

export type AIProvider = 'anthropic' | 'openai' | 'gemini' | 'deepseek';

export const MAX_INPUT_CHARS = 20_000;

const DEFAULT_MODELS: Record<AIProvider, string> = {
  anthropic: process.env.AI_MODEL || 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  gemini: 'gemini-2.0-flash',
  deepseek: 'deepseek-chat',
};

const OPENAI_COMPATIBLE_CONFIG: Record<string, { envVar: string; baseURL?: string }> = {
  openai: { envVar: 'OPENAI_API_KEY' },
  gemini: { envVar: 'GEMINI_API_KEY', baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' },
  deepseek: { envVar: 'DEEPSEEK_API_KEY', baseURL: 'https://api.deepseek.com' },
};

interface ChatCompletionParams {
  provider: AIProvider;
  model?: string;
  system: string;
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
}

export async function chatCompletion({
  provider,
  model,
  system,
  userMessage,
  temperature = 0.2,
  maxTokens = 8192,
}: ChatCompletionParams): Promise<{ text: string | null; error: NextResponse | null }> {
  const resolvedModel = model || DEFAULT_MODELS[provider];

  if (provider === 'anthropic') {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return { text: null, error: NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured in .env.local' }, { status: 401 }) };
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

  // OpenAI-compatible providers (OpenAI, Gemini, DeepSeek)
  const config = OPENAI_COMPATIBLE_CONFIG[provider];
  const key = process.env[config.envVar];
  if (!key) {
    return { text: null, error: NextResponse.json({ error: `${config.envVar} not configured in .env.local` }, { status: 401 }) };
  }
  const client = new OpenAI({
    apiKey: key,
    ...(config.baseURL && { baseURL: config.baseURL }),
  });
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
