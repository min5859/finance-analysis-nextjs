'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCompanyStore } from '@/store/company-store';
import { useEffect, useState } from 'react';

const slideLinks = [
  { href: '/', label: '재무제표 분석 시작' },
  { href: '/dart', label: 'DART 재무제표 데이터' },
  { href: '/summary', label: '요약' },
  { href: '/income-statement', label: '손익계산서' },
  { href: '/balance-sheet', label: '재무상태표' },
  { href: '/growth-rate', label: '성장성 분석' },
  { href: '/profitability', label: '수익성 분석' },
  { href: '/stability', label: '안정성 분석' },
  { href: '/cash-flow', label: '현금흐름표' },
  { href: '/working-capital', label: '운전자본 분석' },
  { href: '/industry-comparison', label: '업계비교 현황' },
  { href: '/conclusion', label: '종합 결론' },
  { href: '/valuation', label: '가치 평가' },
  { href: '/valuation-manual', label: '가치 평가(검증)' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const {
    companies, loadCompanyList, loadCompany, companyData,
    apiKey, setApiKey, dartApiKey, setDartApiKey,
    aiProvider, setAiProvider,
    openaiApiKey, setOpenaiApiKey, deepseekApiKey, setDeepseekApiKey,
  } = useCompanyStore();
  const [envKeys, setEnvKeys] = useState<{ anthropicKeySet: boolean; openaiKeySet: boolean; deepseekKeySet: boolean; dartKeySet: boolean } | null>(null);

  useEffect(() => {
    loadCompanyList();
    fetch('/api/config').then(r => r.json()).then(setEnvKeys).catch(() => {});
  }, [loadCompanyList]);

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

      {/* AI Provider & API Keys */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">AI Provider</label>
          <select
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value as 'anthropic' | 'openai' | 'deepseek')}
            className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="openai">OpenAI (GPT)</option>
            <option value="deepseek">DeepSeek</option>
          </select>
        </div>
        {aiProvider === 'anthropic' && (
          <div>
            <label className="text-xs text-gray-500 block mb-1">Anthropic API Key</label>
            {envKeys?.anthropicKeySet ? (
              <p className="text-xs text-emerald-600 px-2 py-1.5 bg-emerald-50 rounded">.env.local에 설정됨</p>
            ) : (
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            )}
          </div>
        )}
        {aiProvider === 'openai' && (
          <div>
            <label className="text-xs text-gray-500 block mb-1">OpenAI API Key</label>
            {envKeys?.openaiKeySet ? (
              <p className="text-xs text-emerald-600 px-2 py-1.5 bg-emerald-50 rounded">.env.local에 설정됨</p>
            ) : (
              <input
                type="password"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            )}
          </div>
        )}
        {aiProvider === 'deepseek' && (
          <div>
            <label className="text-xs text-gray-500 block mb-1">DeepSeek API Key</label>
            {envKeys?.deepseekKeySet ? (
              <p className="text-xs text-emerald-600 px-2 py-1.5 bg-emerald-50 rounded">.env.local에 설정됨</p>
            ) : (
              <input
                type="password"
                value={deepseekApiKey}
                onChange={(e) => setDeepseekApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            )}
          </div>
        )}
        <div>
          <label className="text-xs text-gray-500 block mb-1">DART API Key</label>
          {envKeys?.dartKeySet ? (
            <p className="text-xs text-emerald-600 px-2 py-1.5 bg-emerald-50 rounded">.env.local에 설정됨</p>
          ) : (
            <input
              type="password"
              value={dartApiKey}
              onChange={(e) => setDartApiKey(e.target.value)}
              placeholder="DART API Key"
              className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
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
