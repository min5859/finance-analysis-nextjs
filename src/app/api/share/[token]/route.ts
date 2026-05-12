import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-error';

/**
 * GET /api/share/[token] — 토큰으로 회사 분석 데이터 조회.
 *
 * 공개 엔드포인트 (proxy.ts 의 PUBLIC_PATHS 에 포함). 토큰을 가진 사람은
 * 누구나 read-only 로 조회 가능.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const link = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        company: {
          include: {
            analyses: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { financialData: true },
            },
          },
        },
      },
    });

    if (!link) return NextResponse.json({ error: 'not found' }, { status: 404 });
    if (link.revokedAt) return NextResponse.json({ error: 'revoked' }, { status: 410 });
    if (link.expiresAt && link.expiresAt < new Date()) {
      return NextResponse.json({ error: 'expired' }, { status: 410 });
    }

    const latest = link.company.analyses[0];
    if (!latest) return NextResponse.json({ error: 'no analysis' }, { status: 404 });

    return NextResponse.json({
      company: { name: link.company.name, sector: link.company.sector },
      financialData: latest.financialData,
    });
  } catch (err) {
    return handleApiError(err, 'share-get');
  }
}

/**
 * DELETE /api/share/[token] — 공유 링크 회수. 인증 필요.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { token } = await params;
    try {
      await prisma.shareLink.update({
        where: { token },
        data: { revokedAt: new Date() },
      });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2025') {
        return NextResponse.json({ error: 'not found' }, { status: 404 });
      }
      throw err;
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, 'share-revoke');
  }
}
