import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

export const AI_MODEL = process.env.AI_MODEL || 'claude-sonnet-4-20250514';
export const MAX_INPUT_CHARS = 20_000;

export function getAnthropicClient(requestApiKey?: string) {
  const key = requestApiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return { client: null as never, error: NextResponse.json({ error: 'API key required' }, { status: 401 }) };
  }
  return { client: new Anthropic({ apiKey: key }), error: null };
}
