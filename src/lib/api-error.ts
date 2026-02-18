import { NextResponse } from 'next/server';

export function handleApiError(err: unknown, context: string): NextResponse {
  console.error(`[API:${context}]`, err);
  return NextResponse.json(
    { error: '처리 중 오류가 발생했습니다.' },
    { status: 500 },
  );
}
