'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCompanyStore } from '@/store/company-store';
import { useEffect, useState } from 'react';
import { navOnlyItems, reportSlides } from '@/lib/slide-config';

const slideLinks = [
  ...navOnlyItems,
  ...reportSlides.map((s) => ({ href: `/${s.id}`, label: s.label })),
];

const AI_KEY_LABELS: Record<string, { label: string; envField: 'anthropicKeySet' | 'openaiKeySet' | 'geminiKeySet' | 'deepseekKeySet' }> = {
  anthropic: { label: 'Anthropic API Key', envField: 'anthropicKeySet' },
  openai: { label: 'OpenAI API Key', envField: 'openaiKeySet' },
  gemini: { label: 'Gemini API Key', envField: 'geminiKeySet' },
  deepseek: { label: 'DeepSeek API Key', envField: 'deepseekKeySet' },
};

export default function Sidebar() {
  const pathname = usePathname();
  const { companies, loadCompanyList, loadCompany, companyData, aiProvider, setAiProvider } = useCompanyStore();
  const [envKeys, setEnvKeys] = useState<{ anthropicKeySet: boolean; openaiKeySet: boolean; geminiKeySet: boolean; deepseekKeySet: boolean; dartKeySet: boolean } | null>(null);

  useEffect(() => {
    loadCompanyList();
    fetch('/api/config').then(r => r.json()).then(setEnvKeys).catch(() => {});
  }, [loadCompanyList]);

  const currentAiKey = AI_KEY_LABELS[aiProvider];

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <img
          src="/04.M&AIKorea_CI_hor_transparent-04(white).png"
          alt="M&AI Korea"
          className="w-full bg-gray-900 rounded p-2"
        />
      </div>

      {/* AI Provider & API Key Status */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">AI Provider</label>
          <select
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value as 'anthropic' | 'openai' | 'gemini' | 'deepseek')}
            className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="openai">OpenAI (GPT)</option>
            <option value="gemini">Google (Gemini)</option>
            <option value="deepseek">DeepSeek</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">{currentAiKey.label}</label>
          {envKeys?.[currentAiKey.envField] ? (
            <p className="text-xs text-emerald-600 px-2 py-1.5 bg-emerald-50 rounded">.env.local에 설정됨</p>
          ) : (
            <p className="text-xs text-red-500 px-2 py-1.5 bg-red-50 rounded">.env.local에 설정 필요</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">DART API Key</label>
          {envKeys?.dartKeySet ? (
            <p className="text-xs text-emerald-600 px-2 py-1.5 bg-emerald-50 rounded">.env.local에 설정됨</p>
          ) : (
            <p className="text-xs text-red-500 px-2 py-1.5 bg-red-50 rounded">.env.local에 설정 필요</p>
          )}
        </div>
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
          <p className="text-xs text-emerald-600 mt-1">
            {companyData.company_name} 데이터 로드됨
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">목차</h3>
        {slideLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
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
