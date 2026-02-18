import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error';

export async function GET() {
  try {
    return NextResponse.json({
      anthropicKeySet: !!process.env.ANTHROPIC_API_KEY,
      openaiKeySet: !!process.env.OPENAI_API_KEY,
      geminiKeySet: !!process.env.GEMINI_API_KEY,
      deepseekKeySet: !!process.env.DEEPSEEK_API_KEY,
      dartKeySet: !!process.env.DART_API_KEY,
    });
  } catch (err) {
    return handleApiError(err, 'config');
  }
}
