import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CompanyFinancialData, CompanyListItem } from '@/types/company';
import type { ValuationResult } from '@/types/valuation';

type AIProvider = 'anthropic' | 'openai' | 'gemini' | 'deepseek';

interface CompanyStore {
  companyData: CompanyFinancialData | null;
  selectedCompany: string | null;
  companies: CompanyListItem[];
  isLoading: boolean;
  error: string | null;
  aiProvider: AIProvider;
  valuationResult: ValuationResult | null;
  isValuating: boolean;

  setCompanyData: (data: CompanyFinancialData) => void;
  setCompanies: (list: CompanyListItem[]) => void;
  loadCompany: (filename: string) => Promise<void>;
  loadCompanyList: () => Promise<void>;
  setAiProvider: (provider: AIProvider) => void;
  setValuationResult: (result: ValuationResult | null) => void;
  setIsValuating: (v: boolean) => void;
  clearData: () => void;
  setError: (err: string | null) => void;
}

export const useCompanyStore = create<CompanyStore>()(persist((set) => ({
  companyData: null,
  selectedCompany: null,
  companies: [],
  isLoading: false,
  error: null,
  aiProvider: 'anthropic',
  valuationResult: null,
  isValuating: false,

  setCompanyData: (data) => set({ companyData: data, error: null }),

  setCompanies: (list) => set({ companies: list }),

  loadCompany: async (filename) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/companies/${encodeURIComponent(filename)}`);
      if (!res.ok) {
        const detail = res.status === 404 ? '해당 기업의 분석 데이터가 없습니다.' : `기업 데이터 로드 실패 (${res.status})`;
        throw new Error(detail);
      }
      const data = await res.json();
      set({ companyData: data, selectedCompany: filename, isLoading: false });
    } catch (err) {
      const msg = (err as Error).message;
      set({ error: msg, isLoading: false });
      if (typeof window !== 'undefined') window.alert(msg);
    }
  },

  loadCompanyList: async () => {
    try {
      const res = await fetch('/api/companies');
      if (!res.ok) return;
      const list = await res.json();
      set({ companies: list });
    } catch (err) {
      console.error('Failed to load company list:', err);
    }
  },

  setAiProvider: (provider) => set({ aiProvider: provider }),

  setValuationResult: (result) => set({ valuationResult: result }),

  setIsValuating: (v) => set({ isValuating: v }),

  clearData: () => set({ companyData: null, selectedCompany: null, valuationResult: null, error: null }),

  setError: (err) => set({ error: err }),
}), {
  name: 'company-store',
  storage: createJSONStorage(() => sessionStorage),
  partialize: (state) => ({
    companyData: state.companyData,
    selectedCompany: state.selectedCompany,
    companies: state.companies,
    aiProvider: state.aiProvider,
    valuationResult: state.valuationResult,
  }),
}));
