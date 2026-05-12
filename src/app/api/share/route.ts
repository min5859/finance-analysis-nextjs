import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-error';

const createSchema = z.object({
  companyId: z.string().min(1),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

function generateToken(): string {
  // 32 bytes → 약 43자 base64url
  return randomBytes(32).toString('base64url');
}

/**
 * POST /api/share — 공유 토큰 발급.
 *
 * 인증된 사용자만 발급 가능. 토큰을 가진 사람은 누구나 read-only 로 회사
 * 분석 페이지를 열람할 수 있으므로, 외부에 흘리지 않도록 사용자 책임.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid', details: parsed.error.issues }, { status: 400 });
    }

    const company = await prisma.company.findUnique({ where: { id: parsed.data.companyId } });
    if (!company) {
      return NextResponse.json({ error: 'company not found' }, { status: 404 });
    }

    const expiresAt = parsed.data.expiresInDays
      ? new Date(Date.now() + parsed.data.expiresInDays * 86_400_000)
      : null;

    const link = await prisma.shareLink.create({
      data: {
        token: generateToken(),
        companyId: company.id,
        createdBy: session.user.email ?? null,
        expiresAt,
      },
    });

    return NextResponse.json({
      token: link.token,
      expiresAt: link.expiresAt,
      companyName: company.name,
    });
  } catch (err) {
    return handleApiError(err, 'share-create');
  }
}

/**
 * GET /api/share?companyId=... — 해당 회사의 활성 공유 링크 목록.
 *
 * 인증 필요. 발급된 토큰을 다시 확인하거나 회수할 때 사용.
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');
    if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });

    const links = await prisma.shareLink.findMany({
      where: { companyId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        token: true,
        createdAt: true,
        expiresAt: true,
        createdBy: true,
      },
    });

    return NextResponse.json({ links });
  } catch (err) {
    return handleApiError(err, 'share-list');
  }
}
