'use client';

import { useState, useCallback } from 'react';
import SlideHeader from '@/components/ui/SlideHeader';
import type { DartFinancialItem, DartCompanyInfo } from '@/types/dart';
import { formatBillion } from '@/lib/format';

interface CorpSearchResult {
  corp_code: string;
  corp_name: string;
  stock_code: string;
}

type TabKey = 'company' | 'bs' | 'is' | 'cf' | 'optimized' | 'audit';

const KEY_ACCOUNTS: Record<string, string[]> = {
  BS: [
    '자산총계', '부채총계', '자본총계', '유동자산', '비유동자산',
    '유동부채', '비유동부채', '자본금', '이익잉여금', '현금및현금성자산',
    '매출채권', '재고자산', '매입채무',
  ],
  IS: [
    '매출액', '매출원가', '매출총이익', '판매비와관리비',
    '영업이익', '당기순이익', '법인세비용차감전순이익',
  ],
  CF: [
    '영업활동현금흐름', '투자활동현금흐름', '재무활동현금흐름',
    '기초현금및현금성자산', '기말현금및현금성자산',
  ],
};

function convertToBillion(amountStr: string): number {
  if (!amountStr || amountStr === '-') return 0;
  const cleaned = amountStr.replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num / 100000000);
}

export default function DartPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CorpSearchResult[]>([]);
  const [selectedCorp, setSelectedCorp] = useState<CorpSearchResult | null>(null);
  const [year, setYear] = useState(String(new Date().getFullYear() - 1));
  const [reportCode, setReportCode] = useState('11011');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [companyInfo, setCompanyInfo] = useState<DartCompanyInfo | null>(null);
  const [financialItems, setFinancialItems] = useState<DartFinancialItem[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [auditData, setAuditData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('company');

  const searchCorps = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setError(null);
    try {
      const res = await fetch(`/api/dart?action=search&query=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Search failed');
      }
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [searchQuery]);

  const loadFinancialData = useCallback(async () => {
    if (!selectedCorp) return;
    setLoading(true);
    setError(null);
    try {
      const [finRes, compRes, auditRes] = await Promise.all([
        fetch(`/api/dart?action=financial&corp_code=${selectedCorp.corp_code}&bsns_year=${year}&reprt_code=${reportCode}`),
        fetch(`/api/dart?action=company-info&corp_code=${selectedCorp.corp_code}`),
        fetch(`/api/dart?action=audit&corp_code=${selectedCorp.corp_code}&bsns_year=${year}&reprt_code=${reportCode}`),
      ]);

      const finData = await finRes.json();
      const compData = await compRes.json();

      if (finData.status === '000' && finData.list) {
        setFinancialItems(finData.list);
      } else {
        setFinancialItems([]);
        setError(finData.message || '재무제표 데이터를 찾을 수 없습니다.');
      }

      if (compData.status === '000') {
        setCompanyInfo(compData);
      }

      const auditJson = await auditRes.json();
      if (auditJson.status === '000') {
        setAuditData(auditJson);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedCorp, year, reportCode]);

  const filterItems = (sjDiv: string, keyOnly: boolean) => {
    const items = financialItems.filter((i) => i.sj_div === sjDiv);
    if (!keyOnly) return items;
    const keys = KEY_ACCOUNTS[sjDiv] || [];
    return items.filter((i) => keys.some((k) => i.account_nm.includes(k)));
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'company', label: '기업정보' },
    { key: 'bs', label: '재무상태표' },
    { key: 'is', label: '손익계산서' },
    { key: 'cf', label: '현금흐름표' },
    { key: 'optimized', label: 'LLM 최적화 데이터' },
    { key: 'audit', label: '감사보고서' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - 1 - i));

  const reportTypes = [
    { code: '11011', label: '사업보고서 (연간)' },
    { code: '11014', label: '1분기보고서' },
    { code: '11012', label: '반기보고서' },
    { code: '11013', label: '3분기보고서' },
  ];

  return (
    <div>
      <SlideHeader title="DART 재무제표 데이터" />

      {/* Search Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">기업 검색</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchCorps()}
              placeholder="기업명 또는 종목코드 입력"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={searchCorps}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
          >
            검색
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-3 max-h-48 overflow-y-auto border border-gray-200 rounded">
            {searchResults.map((corp) => (
              <button
                key={corp.corp_code}
                onClick={() => {
                  setSelectedCorp(corp);
                  setSearchResults([]);
                  setSearchQuery(corp.corp_name);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 border-b border-gray-100 last:border-0 transition-colors ${
                  selectedCorp?.corp_code === corp.corp_code ? 'bg-indigo-50 text-indigo-700' : ''
                }`}
              >
                <span className="font-medium">{corp.corp_name}</span>
                <span className="text-gray-400 ml-2">({corp.stock_code})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fetch Controls */}
      {selectedCorp && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex gap-3 items-end">
            <div>
              <label className="text-xs text-gray-500 block mb-1">사업연도</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">보고서 유형</label>
              <select
                value={reportCode}
                onChange={(e) => setReportCode(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded"
              >
                {reportTypes.map((r) => (
                  <option key={r.code} value={r.code}>{r.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={loadFinancialData}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '조회중...' : '재무제표 조회'}
            </button>
            <div className="text-sm text-gray-500 self-center">
              선택: <strong>{selectedCorp.corp_name}</strong> ({selectedCorp.stock_code})
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Tabs & Content */}
      {(financialItems.length > 0 || companyInfo) && (
        <>
          <div className="flex gap-1 border-b border-gray-200 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Company Info Tab */}
          {activeTab === 'company' && companyInfo && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">{companyInfo.corp_name}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['영문명', companyInfo.corp_name_eng],
                  ['종목명', companyInfo.stock_name],
                  ['종목코드', companyInfo.stock_code],
                  ['대표이사', companyInfo.ceo_nm],
                  ['법인구분', companyInfo.corp_cls === 'Y' ? '유가증권' : companyInfo.corp_cls === 'K' ? '코스닥' : companyInfo.corp_cls],
                  ['업종코드', companyInfo.induty_code],
                  ['설립일', companyInfo.est_dt],
                  ['결산월', `${companyInfo.acc_mt}월`],
                ].map(([label, value]) => (
                  <div key={label} className="flex">
                    <span className="text-gray-500 w-24 shrink-0">{label}</span>
                    <span className="font-medium">{value || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Statement Tabs */}
          {(activeTab === 'bs' || activeTab === 'is' || activeTab === 'cf') && (
            <FinancialTable
              items={filterItems(activeTab.toUpperCase(), false)}
              keyItems={filterItems(activeTab.toUpperCase(), true)}
              title={activeTab === 'bs' ? '재무상태표' : activeTab === 'is' ? '손익계산서' : '현금흐름표'}
            />
          )}

          {/* LLM Optimized Data Tab */}
          {activeTab === 'optimized' && (
            <OptimizedDataView items={financialItems} corpName={selectedCorp?.corp_name || ''} year={year} />
          )}

          {/* Audit Report Tab */}
          {activeTab === 'audit' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">감사보고서</h3>
              {auditData?.list ? (
                <div className="space-y-3">
                  {auditData.list.map((item: { dcm_no?: string; auditor?: string; adt_reprt_opinion?: string; adt_a?: string }, idx: number) => (
                    <div key={idx} className="border border-gray-100 rounded p-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {item.auditor && (
                          <div><span className="text-gray-500">감사인:</span> <span className="font-medium">{item.auditor}</span></div>
                        )}
                        {item.adt_reprt_opinion && (
                          <div><span className="text-gray-500">감사의견:</span> <span className="font-medium">{item.adt_reprt_opinion}</span></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">감사보고서 데이터가 없습니다.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FinancialTable({
  items,
  keyItems,
  title,
}: {
  items: DartFinancialItem[];
  keyItems: DartFinancialItem[];
  title: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const displayItems = showAll ? items : keyItems;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-indigo-600 hover:underline"
        >
          {showAll ? '주요항목만 보기' : `전체 항목 보기 (${items.length})`}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">계정명</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">당기 (억원)</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">전기 (억원)</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">전전기 (억원)</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item, idx) => (
              <tr key={`${item.account_nm}-${idx}`} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-800">{item.account_nm}</td>
                <td className="px-4 py-2 text-right font-mono">{formatBillion(convertToBillion(item.thstrm_amount))}</td>
                <td className="px-4 py-2 text-right font-mono">{formatBillion(convertToBillion(item.frmtrm_amount))}</td>
                <td className="px-4 py-2 text-right font-mono">{formatBillion(convertToBillion(item.bfefrmtrm_amount))}</td>
              </tr>
            ))}
            {displayItems.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">데이터가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OptimizedDataView({
  items,
  corpName,
  year,
}: {
  items: DartFinancialItem[];
  corpName: string;
  year: string;
}) {
  const getKeyItems = (sjDiv: string) => {
    const keys = KEY_ACCOUNTS[sjDiv] || [];
    return items
      .filter((i) => i.sj_div === sjDiv)
      .filter((i) => keys.some((k) => i.account_nm.includes(k)))
      .map((i) => ({
        account_nm: i.account_nm,
        thstrm: convertToBillion(i.thstrm_amount),
        frmtrm: convertToBillion(i.frmtrm_amount),
        bfefrmtrm: convertToBillion(i.bfefrmtrm_amount),
      }));
  };

  const optimized = {
    company: corpName,
    year,
    unit: '억원',
    balance_sheet: getKeyItems('BS'),
    income_statement: getKeyItems('IS'),
    cash_flow: getKeyItems('CF'),
  };

  const jsonStr = JSON.stringify(optimized, null, 2);
  const tokenEstimate = Math.round(jsonStr.length / 4);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-indigo-50 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500">재무상태표 항목</p>
          <p className="text-2xl font-bold text-indigo-700">{getKeyItems('BS').length}</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500">손익계산서 항목</p>
          <p className="text-2xl font-bold text-emerald-700">{getKeyItems('IS').length}</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500">현금흐름표 항목</p>
          <p className="text-2xl font-bold text-amber-700">{getKeyItems('CF').length}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-sm text-gray-700">JSON (LLM 최적화)</h4>
          <div className="flex gap-3 text-xs text-gray-500">
            <span>예상 토큰: ~{tokenEstimate.toLocaleString()}</span>
            <button
              onClick={() => navigator.clipboard.writeText(jsonStr)}
              className="text-indigo-600 hover:underline"
            >
              복사
            </button>
          </div>
        </div>
        <pre className="text-xs bg-white border border-gray-200 rounded p-3 overflow-auto max-h-96 font-mono">
          {jsonStr}
        </pre>
      </div>
    </div>
  );
}
