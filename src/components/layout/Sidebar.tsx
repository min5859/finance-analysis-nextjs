'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useCompanyStore } from '@/store/company-store';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { navOnlyItems, reportSlides } from '@/lib/slide-config';
import type { AIProvider } from '@/lib/ai-client';

const slideLinks = [
  ...navOnlyItems,
  ...reportSlides.map((s) => ({ href: `/${s.id}`, label: s.label })),
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const {
    companies,
    loadCompanyList,
    loadCompany,
    companyData,
    selectedCompany,
    clearData,
    aiProvider,
    setAiProvider,
  } = useCompanyStore();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCompanyList();
  }, [loadCompanyList]);

  const handleDownloadJson = () => {
    if (!companyData) return;
    const json = JSON.stringify(companyData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCompany ?? companyData.company_name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!selectedCompany || !companyData) return;
    const expected = companyData.company_name;
    const typed = window.prompt(
      `정말 "${expected}" 회사를 삭제하시겠습니까?\n관련된 모든 분석 데이터가 함께 삭제됩니다.\n\n확인을 위해 회사명을 정확히 입력하세요:`,
    );
    if (typed === null) return;
    if (typed.trim() !== expected) {
      window.alert('회사명이 일치하지 않아 삭제를 취소했습니다.');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/companies/${encodeURIComponent(selectedCompany)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `삭제 실패 (${res.status})`);
      }
      clearData();
      await loadCompanyList();
      router.refresh();
    } catch (err) {
      window.alert((err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <Link
        href="/"
        aria-label="홈으로 이동"
        className="block p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="bg-gray-900 rounded p-2 flex items-center justify-center">
          <Image
            src="/04.M&AIKorea_CI_hor_transparent-04(white).png"
            alt="M&AI Korea"
            width={224}
            height={48}
            className="block w-full h-auto"
            priority
          />
        </div>
      </Link>

      {/* AI Provider */}
      <div className="p-4 border-b border-gray-200">
        <label className="text-xs text-gray-500 block mb-1">AI Provider</label>
        <select
          value={aiProvider}
          onChange={(e) => setAiProvider(e.target.value as AIProvider)}
          className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="openai">OpenAI (GPT)</option>
          <option value="gemini">Google (Gemini)</option>
          <option value="deepseek">DeepSeek</option>
        </select>
      </div>

      {/* Company Select */}
      <div className="p-4 border-b border-gray-200">
        <label className="text-xs text-gray-500 block mb-1">분석할 기업 선택</label>
        <select
          onChange={(e) => e.target.value && loadCompany(e.target.value)}
          defaultValue=""
          className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">기업을 선택하세요</option>
          {companies.map((c) => (
            <option key={c.filename} value={c.filename}>
              {c.name} ({c.sector})
            </option>
          ))}
        </select>
        {companyData && (
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-emerald-600">
              {companyData.company_name} 데이터 로드됨
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDownloadJson}
                title="JSON 데이터 다운로드"
                className="text-xs text-gray-400 hover:text-indigo-600 px-1"
              >
                ⬇️
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || !selectedCompany}
                title="선택한 회사 삭제"
                className="text-xs text-gray-400 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed px-1"
              >
                {isDeleting ? '삭제중...' : '🗑️'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User + Logout */}
      {session?.user && (
        <div className="p-3 border-b border-gray-200 flex items-center justify-between gap-2">
          <span className="text-xs text-gray-600 truncate" title={session.user.email ?? ''}>
            {session.user.email ?? session.user.name ?? '로그인됨'}
          </span>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-xs text-gray-500 hover:text-red-600 underline-offset-2 hover:underline shrink-0"
          >
            로그아웃
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">목차</h3>
        {slideLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`block text-sm px-3 py-1.5 rounded my-0.5 transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
