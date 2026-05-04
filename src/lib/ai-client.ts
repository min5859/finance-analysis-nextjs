import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

export type AIProvider = 'anthropic' | 'openai' | 'gemini' | 'deepseek';

export const MAX_INPUT_CHARS = 20_000;

const DEFAULT_MODELS: Record<AIProvider, string> = {
  anthropic: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
  openai: process.env.OPENAI_MODEL || 'gpt-4o',
  gemini: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  deepseek: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
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

interface ChatCompletionJsonParams {
  provider: AIProvider;
  model?: string;
  system: string;
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
  /** Optional JSON Schema. Anthropic uses it for tool_use input_schema. OpenAI uses it for response_format json_schema. Other providers ignore it. */
  jsonSchema?: Record<string, unknown>;
  /** Anthropic tool name (also used as OpenAI json_schema name). */
  toolName?: string;
  /** Binary attachments (currently base64-encoded PDFs). Only Anthropic supports native PDF input; other providers ignore. */
  attachments?: PdfAttachment[];
}

export interface PdfAttachment {
  kind: 'pdf';
  /** base64-encoded PDF bytes (no data URL prefix). */
  base64: string;
}

/** Providers that accept PDF binaries directly (vision + OCR built-in). */
export const PROVIDERS_WITH_PDF_INPUT: ReadonlyArray<AIProvider> = ['anthropic'];

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

/**
 * Provider-native structured JSON output:
 *   - Anthropic: tool_use with forced tool_choice
 *   - OpenAI:    response_format json_schema (if schema given) / json_object (otherwise)
 *   - Gemini, DeepSeek: response_format json_object via OpenAI-compat endpoint
 *
 * Returns parsed JSON object directly. Eliminates need for regex JSON extraction.
 */
export async function chatCompletionJson<T = unknown>({
  provider,
  model,
  system,
  userMessage,
  temperature = 0.1,
  maxTokens = 8192,
  jsonSchema,
  toolName = 'extract_data',
  attachments,
}: ChatCompletionJsonParams): Promise<{ data: T | null; error: NextResponse | null }> {
  const resolvedModel = model || DEFAULT_MODELS[provider];

  if (provider === 'anthropic') {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return { data: null, error: NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured in .env.local' }, { status: 401 }) };
    }
    const client = new Anthropic({ apiKey: key });
    const inputSchema = (jsonSchema ?? { type: 'object', additionalProperties: true }) as Anthropic.Tool.InputSchema;

    const userContent: Anthropic.ContentBlockParam[] = [];
    for (const att of attachments ?? []) {
      if (att.kind === 'pdf') {
        userContent.push({
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: att.base64 },
        });
      }
    }
    userContent.push({ type: 'text', text: userMessage });

    const response = await client.messages.create({
      model: resolvedModel,
      system,
      messages: [{ role: 'user', content: userContent }],
      tools: [{
        name: toolName,
        description: 'Return the requested analysis as a structured JSON object.',
        input_schema: inputSchema,
      }],
      tool_choice: { type: 'tool', name: toolName },
      temperature,
      max_tokens: maxTokens,
    });
    const toolUse = response.content.find((c): c is Anthropic.ToolUseBlock => c.type === 'tool_use');
    if (!toolUse) {
      console.error('[ai-client] Anthropic did not return tool_use block');
      return { data: null, error: NextResponse.json({ error: 'AI did not return structured output' }, { status: 500 }) };
    }
    return { data: toolUse.input as T, error: null };
  }

  // OpenAI-compatible providers
  const config = OPENAI_COMPATIBLE_CONFIG[provider];
  const key = process.env[config.envVar];
  if (!key) {
    return { data: null, error: NextResponse.json({ error: `${config.envVar} not configured in .env.local` }, { status: 401 }) };
  }
  const client = new OpenAI({
    apiKey: key,
    ...(config.baseURL && { baseURL: config.baseURL }),
  });

  // Use json_schema only on OpenAI proper; other compat endpoints fall back to plain json_object.
  const responseFormat = provider === 'openai' && jsonSchema
    ? { type: 'json_schema' as const, json_schema: { name: toolName, schema: jsonSchema, strict: false } }
    : { type: 'json_object' as const };

  const response = await client.chat.completions.create({
    model: resolvedModel,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userMessage },
    ],
    response_format: responseFormat,
    temperature,
    max_tokens: maxTokens,
  });
  const content = response.choices[0].message.content ?? '';
  try {
    return { data: JSON.parse(content) as T, error: null };
  } catch (err) {
    console.error(`[ai-client] JSON parse failed for ${provider} despite response_format:`, err, '\nRaw (first 500 chars):', content.slice(0, 500));
    return { data: null, error: NextResponse.json({ error: 'AI returned malformed JSON' }, { status: 500 }) };
  }
}
