import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-error';

const DART_BASE = 'https://opendart.fss.or.kr/api';

const corpCodeSchema = z.string().regex(/^\d{8}$/, '유효하지 않은 기업 코드입니다.');
const bsnsYearSchema = z.string().regex(/^\d{4}$/, '유효하지 않은 사업연도입니다.');
const reprtCodeSchema = z.string().regex(/^\d{5}$/, '유효하지 않은 보고서 코드입니다.');

// Module-level cache for corp codes
let corpCodesCache: { corp_code: string; corp_name: string; stock_code: string }[] | null = null;
let corpCodesCacheTime = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간

async function fetchCorpCodes(apiKey: string) {
  if (corpCodesCache && Date.now() - corpCodesCacheTime < CACHE_TTL) return corpCodesCache;

  const res = await fetch(`${DART_BASE}/corpCode.xml?crtfc_key=${apiKey}`);
  if (!res.ok) throw new Error('DART API corp codes fetch failed');

  const buffer = await res.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const xmlFile = zip.file('CORPCODE.xml');
  if (!xmlFile) throw new Error('CORPCODE.xml not found in ZIP');

  const xmlText = await xmlFile.async('text');

  // Parse XML simply - extract <list> entries
  const entries: { corp_code: string; corp_name: string; stock_code: string }[] = [];
  const listRegex = /<list>([\s\S]*?)<\/list>/g;
  let match;
  while ((match = listRegex.exec(xmlText)) !== null) {
    const block = match[1];
    const corpCode = block.match(/<corp_code>(.*?)<\/corp_code>/)?.[1] || '';
    const corpName = block.match(/<corp_name>(.*?)<\/corp_name>/)?.[1] || '';
    const stockCode = (block.match(/<stock_code>(.*?)<\/stock_code>/)?.[1] || '').trim();
    // Only include listed companies (with stock code)
    if (stockCode) {
      entries.push({ corp_code: corpCode, corp_name: corpName, stock_code: stockCode });
    }
  }

  corpCodesCache = entries;
  corpCodesCacheTime = Date.now();
  return entries;
}

function validateCorpParams(searchParams: URLSearchParams, requireYear: boolean) {
  const corpResult = corpCodeSchema.safeParse(searchParams.get('corp_code'));
  if (!corpResult.success) {
    return { error: corpResult.error.issues[0].message };
  }

  if (requireYear) {
    const yearResult = bsnsYearSchema.safeParse(searchParams.get('bsns_year'));
    if (!yearResult.success) {
      return { error: yearResult.error.issues[0].message };
    }

    const rawReprt = searchParams.get('reprt_code') || '11011';
    const reprtResult = reprtCodeSchema.safeParse(rawReprt);
    if (!reprtResult.success) {
      return { error: reprtResult.error.issues[0].message };
    }

    return { corp_code: corpResult.data, bsns_year: yearResult.data, reprt_code: reprtResult.data };
  }

  return { corp_code: corpResult.data };
}

// GET /api/dart?action=search&query=삼성
// GET /api/dart?action=financial&corp_code=xxx&bsns_year=2024&reprt_code=11011
// GET /api/dart?action=company-info&corp_code=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const dartKey = process.env.DART_API_KEY;

  if (!dartKey) {
    return NextResponse.json({ error: 'DART API key not configured (set DART_API_KEY env)' }, { status: 500 });
  }

  try {
    if (action === 'search') {
      const query = searchParams.get('query') || '';
      const codes = await fetchCorpCodes(dartKey);
      const filtered = codes
        .filter((c) => c.corp_name.includes(query) || c.stock_code === query)
        .slice(0, 50);
      return NextResponse.json(filtered);
    }

    if (action === 'financial') {
      const params = validateCorpParams(searchParams, true);
      if ('error' in params) {
        return NextResponse.json({ error: params.error }, { status: 400 });
      }

      const res = await fetch(
        `${DART_BASE}/fnlttSinglAcntAll.json?crtfc_key=${dartKey}&corp_code=${params.corp_code}&bsns_year=${params.bsns_year}&reprt_code=${params.reprt_code}&fs_div=CFS`
      );
      const data = await res.json();

      if (data.status !== '000') {
        // Try OFS (individual financial statements) if CFS fails
        const res2 = await fetch(
          `${DART_BASE}/fnlttSinglAcntAll.json?crtfc_key=${dartKey}&corp_code=${params.corp_code}&bsns_year=${params.bsns_year}&reprt_code=${params.reprt_code}&fs_div=OFS`
        );
        const data2 = await res2.json();
        return NextResponse.json(data2);
      }
      return NextResponse.json(data);
    }

    if (action === 'company-info') {
      const params = validateCorpParams(searchParams, false);
      if ('error' in params) {
        return NextResponse.json({ error: params.error }, { status: 400 });
      }

      const res = await fetch(`${DART_BASE}/company.json?crtfc_key=${dartKey}&corp_code=${params.corp_code}`);
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === 'audit') {
      const params = validateCorpParams(searchParams, true);
      if ('error' in params) {
        return NextResponse.json({ error: params.error }, { status: 400 });
      }

      const res = await fetch(
        `${DART_BASE}/irdsSttus.json?crtfc_key=${dartKey}&corp_code=${params.corp_code}&bsns_year=${params.bsns_year}&reprt_code=${params.reprt_code}`
      );
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return handleApiError(err, 'dart');
  }
}
