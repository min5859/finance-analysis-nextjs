import { prisma } from '@/lib/prisma';
import { estimateCostUsd } from '@/lib/pricing';

export type UsageSource = 'extract-server' | 'extract-client-anthropic' | 'valuation';

interface RecordUsageInput {
  userEmail: string | null;
  provider: string;
  model: string | null | undefined;
  inputTokens: number;
  outputTokens: number;
  source: UsageSource;
}

/**
 * 일일 한도 (USD). 환경변수로 덮어쓸 수 있음. 기본 5달러.
 * 사용자 1명이 하루에 태울 수 있는 추정 비용 상한.
 */
export function getDailyLimitUsd(): number {
  const env = process.env.DAILY_USAGE_LIMIT_USD;
  const parsed = env ? Number(env) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
}

export async function recordUsage(input: RecordUsageInput): Promise<void> {
  const costUsd = estimateCostUsd(input.provider, input.model, input.inputTokens, input.outputTokens);
  try {
    await prisma.usageEvent.create({
      data: {
        userEmail: input.userEmail,
        provider: input.provider,
        model: input.model ?? null,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        costUsd,
        source: input.source,
      },
    });
  } catch (err) {
    // best-effort: 로깅 실패가 응답을 깨면 안 됨.
    console.error('[usage] failed to record usage event', err);
  }
}

export interface DailyUsageSummary {
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
  limitUsd: number;
  remainingUsd: number;
  overLimit: boolean;
}

/**
 * userEmail 의 오늘 (UTC 자정 기준) 누적 사용량.
 * userEmail 이 null 이면 전 사용자 합계 (운영 모니터링 용).
 */
export async function getDailyUsage(userEmail: string | null): Promise<DailyUsageSummary> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);

  const agg = await prisma.usageEvent.aggregate({
    where: {
      createdAt: { gte: since },
      ...(userEmail ? { userEmail } : {}),
    },
    _sum: {
      costUsd: true,
      inputTokens: true,
      outputTokens: true,
    },
  });

  const costUsd = agg._sum.costUsd ?? 0;
  const limitUsd = getDailyLimitUsd();
  return {
    costUsd,
    inputTokens: agg._sum.inputTokens ?? 0,
    outputTokens: agg._sum.outputTokens ?? 0,
    limitUsd,
    remainingUsd: Math.max(0, limitUsd - costUsd),
    overLimit: costUsd >= limitUsd,
  };
}
