import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    anthropicKeySet: !!process.env.ANTHROPIC_API_KEY,
    openaiKeySet: !!process.env.OPENAI_API_KEY,
    geminiKeySet: !!process.env.GEMINI_API_KEY,
    deepseekKeySet: !!process.env.DEEPSEEK_API_KEY,
    dartKeySet: !!process.env.DART_API_KEY,
  });
}
