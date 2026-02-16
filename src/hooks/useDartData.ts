import { useState, useCallback } from 'react';
import type { DartFinancialItem, DartCompanyInfo } from '@/types/dart';
import type { CorpSearchResult, TabKey } from '@/features/dart/constants';
import { KEY_ACCOUNTS } from '@/features/dart/constants';

interface AuditItem {
  dcm_no?: string;
  auditor?: string;
  adt_reprt_opinion?: string;
  adt_a?: string;
}

export interface AuditData {
  status: string;
  list?: AuditItem[];
}

export function useDartData() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CorpSearchResult[]>([]);
  const [selectedCorp, setSelectedCorp] = useState<CorpSearchResult | null>(null);
  const [year, setYear] = useState(String(new Date().getFullYear() - 1));
  const [reportCode, setReportCode] = useState('11011');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [companyInfo, setCompanyInfo] = useState<DartCompanyInfo | null>(null);
  const [financialItems, setFinancialItems] = useState<DartFinancialItem[]>([]);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
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

  return {
    searchQuery, setSearchQuery, searchResults, setSearchResults,
    selectedCorp, setSelectedCorp,
    year, setYear, reportCode, setReportCode, loading, error,
    companyInfo, financialItems, auditData, activeTab, setActiveTab,
    searchCorps, loadFinancialData, filterItems,
  };
}
