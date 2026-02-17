import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
