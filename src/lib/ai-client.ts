import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

export type AIProvider = 'anthropic' | 'openai' | 'deepseek';

export const MAX_INPUT_CHARS = 20_000;

const DEFAULT_MODELS: Record<AIProvider, string> = {
  anthropic: process.env.AI_MODEL || 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  deepseek: 'deepseek-chat',
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
  maxTokens = 4000,
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

  // OpenAI & DeepSeek (both OpenAI-compatible)
  const key = provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.DEEPSEEK_API_KEY;
  const envVar = provider === 'openai' ? 'OPENAI_API_KEY' : 'DEEPSEEK_API_KEY';
  if (!key) {
    return { text: null, error: NextResponse.json({ error: `${envVar} not configured in .env.local` }, { status: 401 }) };
  }
  const clientOptions = provider === 'openai'
    ? { apiKey: key }
    : { apiKey: key, baseURL: 'https://api.deepseek.com' };
  const client = new OpenAI(clientOptions);
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
