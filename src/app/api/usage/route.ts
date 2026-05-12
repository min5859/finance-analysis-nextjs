import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { recordUsage, getDailyUsage } from '@/lib/usage';
import { handleApiError } from '@/lib/api-error';

const reportSchema = z.object({
  provider: z.string().min(1),
  model: z.string().optional(),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  source: z.enum(['extract-client-anthropic']),
});

/**
 * GET: 현재 사용자의 오늘자 누적 사용량을 조회. UI 가시화 용도.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const usage = await getDailyUsage(session.user.email ?? null);
    return NextResponse.json(usage);
  } catch (err) {
    return handleApiError(err, 'usage-get');
  }
}

/**
 * POST: client-direct (브라우저가 Anthropic 을 직접 호출하는) 경로에서
 * 분석 완료 후 token usage 를 신고. 서버 측 ai-client 경로는 자동 기록
 * 되지만 client-direct 는 서버를 우회하므로 별도 신고 필요.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid', details: parsed.error.issues }, { status: 400 });
    }
    await recordUsage({
      userEmail: session.user.email ?? null,
      provider: parsed.data.provider,
      model: parsed.data.model ?? null,
      inputTokens: parsed.data.inputTokens,
      outputTokens: parsed.data.outputTokens,
      source: parsed.data.source,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, 'usage-post');
  }
}
