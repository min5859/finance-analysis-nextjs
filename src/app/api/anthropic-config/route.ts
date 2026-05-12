import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { auth } from '@/auth';
import { getDailyUsage } from '@/lib/usage';

// ⚠️ TEMPORARY — 보안 부채 보유 코드 ⚠️
//
// 이 엔드포인트는 인증된 클라이언트에게 ANTHROPIC_API_KEY 를 그대로 내려준다.
// 브라우저 console / DevTools / Network 탭에서 키 추출이 가능. 즉, 도메인
// (mnaikorea.com) 인증된 모든 사용자가 마음대로 Anthropic API 호출에 그 키를
// 사용할 수 있다 → 비용 도용·rate limit 무력화 가능.
//
// 도입 사유: Vercel Hobby plan 의 60초 함수 timeout 으로 큰 PDF (사업보고서)
// 의 vision 분석이 서버에서 완료되지 않음. 클라이언트가 직접 Anthropic 을
// 호출하면 timeout 제한이 사라짐.
//
// 회수 조건 (다음 중 하나가 만족되는 즉시 이 엔드포인트와 client-direct 경로
// 를 제거하고 서버 사이드 /api/extract 로 복귀):
//   1. Vercel Pro 업그레이드 → maxDuration 300s
//   2. Google Cloud Run 마이그레이션 → 60min timeout
//   3. 외부 워커 (Inngest 등) 도입
//
// 추적: docs/tasks/todo.md G 섹션
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 일일 한도 가드 — 키 발급 전에 차단해야 client-direct 호출이 막힘.
  const usage = await getDailyUsage(session.user.email ?? null);
  if (usage.overLimit) {
    return NextResponse.json(
      {
        error: `일일 사용 한도 초과 ($${usage.limitUsd.toFixed(2)}).`,
        usage,
      },
      { status: 429 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const promptPath = path.join(process.cwd(), 'src/data/prompt.txt');
  const templatePath = path.join(process.cwd(), 'src/data/finance_format.json');
  const prompt = fs.existsSync(promptPath) ? fs.readFileSync(promptPath, 'utf-8') : '';
  const template = fs.existsSync(templatePath) ? fs.readFileSync(templatePath, 'utf-8') : '{}';

  return NextResponse.json({
    apiKey,
    model: process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-20250514',
    system: `${prompt}\n\nJSON 템플릿:\n${template}`,
  });
}
