import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const companySaveSchema = z.object({
  company_name: z.string().min(1),
  sector: z.string().optional(),
}).passthrough();

export async function GET() {
  const companiesDir = path.join(process.cwd(), 'src/data/companies');
  const companies: Array<{filename: string; name: string; sector: string}> = [];

  if (!fs.existsSync(companiesDir)) {
    return NextResponse.json([]);
  }

  const files = fs.readdirSync(companiesDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(companiesDir, file), 'utf-8'));
      companies.push({
        filename: file,
        name: data.company_name || file.replace('.json', ''),
        sector: data.sector || '기타',
      });
    } catch { /* skip */ }
  }

  companies.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  return NextResponse.json(companies);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = companySaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: '유효하지 않은 데이터 형식입니다.', details: parsed.error.issues }, { status: 400 });
    }

    const data = parsed.data;
    const companiesDir = path.join(process.cwd(), 'src/data/companies');
    if (!fs.existsSync(companiesDir)) {
      fs.mkdirSync(companiesDir, { recursive: true });
    }

    const filename = `${data.company_name.replace(/[^가-힣a-zA-Z0-9_-]/g, '_')}.json`;
    fs.writeFileSync(path.join(companiesDir, filename), JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ success: true, filename });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
