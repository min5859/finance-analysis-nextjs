'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useCompanyStore } from '@/store/company-store';
import { reportSlides } from '@/lib/slide-config';
import type { CompanyFinancialData } from '@/types/company';

interface ShareResponse {
  company: { name: string; sector: string | null };
  financialData: CompanyFinancialData;
}

const ERROR_MESSAGES: Record<string, string> = {
  'not found': '공유 링크를 찾을 수 없습니다.',
  revoked: '공유 링크가 회수되었습니다.',
  expired: '공유 링크가 만료되었습니다.',
  'no analysis': '연결된 분석 결과가 없습니다.',
};

export default function SharePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const setCompanyData = useCompanyStore((s) => s.setCompanyData);
  const companyData = useCompanyStore((s) => s.companyData);
  const [meta, setMeta] = useState<ShareResponse['company'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/share/${encodeURIComponent(token)}`);
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          const key = body?.error ?? '';
          throw new Error(ERROR_MESSAGES[key] ?? `링크 로드 실패 (HTTP ${res.status})`);
        }
        const data = (await res.json()) as ShareResponse;
        if (cancelled) return;
        setCompanyData(data.financialData);
        setMeta(data.company);
        setLoaded(true);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, setCompanyData]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-800 mb-2">공유 링크 열기 실패</h1>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!loaded || !companyData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">공유 리포트 로드 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-gray-800">{meta?.name ?? companyData.company_name} — 재무 분석 (공유)</h1>
          <p className="text-xs text-gray-500">읽기 전용 · 외부 공유 링크</p>
        </div>
        <span className="text-xs text-gray-400">{meta?.sector ?? companyData.sector}</span>
      </div>
      <div className="max-w-6xl mx-auto p-6 space-y-10">
        {reportSlides.map(({ id, label, Component }) => (
          <section key={id} id={id} className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="sr-only">{label}</h2>
            <Component />
          </section>
        ))}
      </div>
    </div>
  );
}
