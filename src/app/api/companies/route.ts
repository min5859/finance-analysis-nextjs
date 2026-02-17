import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const companySaveSchema = z.object({
  company_name: z.string().min(1),
  company_code: z.string().optional(),
  sector: z.string().optional(),
  report_year: z.string().optional(),
}).passthrough();

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        sector: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(
      companies.map((c) => ({
        filename: c.id,
        name: c.name,
        sector: c.sector || '기타',
      })),
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = companySaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '유효하지 않은 데이터 형식입니다.', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const company = await prisma.company.upsert({
      where: {
        name_corpCode: {
          name: data.company_name,
          corpCode: data.company_code || '',
        },
      },
      create: {
        name: data.company_name,
        corpCode: data.company_code || null,
        sector: data.sector || null,
      },
      update: {
        sector: data.sector || undefined,
      },
    });

    await prisma.analysis.create({
      data: {
        companyId: company.id,
        reportYear: data.report_year || '',
        provider: 'anthropic',
        financialData: body,
      },
    });

    return NextResponse.json({ success: true, filename: company.id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
