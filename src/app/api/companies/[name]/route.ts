import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const companiesDir = path.join(process.cwd(), 'src/data/companies');

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const safeName = path.basename(name);
  if (!safeName.endsWith('.json')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  const filePath = path.join(companiesDir, safeName);
  if (!filePath.startsWith(companiesDir)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Invalid data file' }, { status: 500 });
  }
}
