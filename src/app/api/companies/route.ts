import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-error';

const companySaveSchema = z.object({
  company_name: z.string().min(1),
  company_code: z.string().optional(),
  sector: z.string().optional(),
  report_year: z.string().optional(),
  performance_data: z.record(z.string(), z.unknown()).optional(),
  balance_sheet_data: z.record(z.string(), z.unknown()).optional(),
  stability_data: z.record(z.string(), z.unknown()).optional(),
  cash_flow_data: z.record(z.string(), z.unknown()).optional(),
  working_capital_data: z.record(z.string(), z.unknown()).optional(),
  profitability_data: z.record(z.string(), z.unknown()).optional(),
  growth_rates: z.record(z.string(), z.unknown()).optional(),
  dupont_data: z.record(z.string(), z.unknown()).optional(),
  radar_data: z.record(z.string(), z.unknown()).optional(),
  insights: z.record(z.string(), z.unknown()).optional(),
  conclusion: z.record(z.string(), z.unknown()).optional(),
});

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
    return handleApiError(err, 'companies-list');
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
        financialData: data as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ success: true, filename: company.id });
  } catch (err) {
    return handleApiError(err, 'companies-save');
  }
}
