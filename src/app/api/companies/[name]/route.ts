import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-error';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;

  try {
    // name은 company UUID (기존 filename 자리)
    const analysis = await prisma.analysis.findFirst({
      where: { companyId: name },
      orderBy: { createdAt: 'desc' },
      select: { financialData: true },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(analysis.financialData);
  } catch (err) {
    return handleApiError(err, 'companies-detail');
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;

  try {
    // 관련 financial_statements / analyses / valuations는 onDelete: Cascade로 자동 삭제
    await prisma.company.delete({ where: { id: name } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if ((err as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return handleApiError(err, 'companies-delete');
  }
}
