import { create } from 'zustand';
import type { CompanyFinancialData, CompanyListItem } from '@/types/company';
import type { ValuationResult } from '@/types/valuation';

type AIProvider = 'anthropic' | 'openai' | 'deepseek';

interface CompanyStore {
  companyData: CompanyFinancialData | null;
  selectedCompany: string | null;
  companies: CompanyListItem[];
  isLoading: boolean;
  error: string | null;
  apiKey: string;
  dartApiKey: string;
  aiProvider: AIProvider;
  openaiApiKey: string;
  deepseekApiKey: string;
  valuationResult: ValuationResult | null;
  isValuating: boolean;

  setCompanyData: (data: CompanyFinancialData) => void;
  setCompanies: (list: CompanyListItem[]) => void;
  loadCompany: (filename: string) => Promise<void>;
  loadCompanyList: () => Promise<void>;
  setApiKey: (key: string) => void;
  setDartApiKey: (key: string) => void;
  setAiProvider: (provider: AIProvider) => void;
  setOpenaiApiKey: (key: string) => void;
  setDeepseekApiKey: (key: string) => void;
  setValuationResult: (result: ValuationResult | null) => void;
  setIsValuating: (v: boolean) => void;
  clearData: () => void;
  setError: (err: string | null) => void;
}

export const useCompanyStore = create<CompanyStore>((set) => ({
  companyData: null,
  selectedCompany: null,
  companies: [],
  isLoading: false,
  error: null,
  apiKey: '',
  dartApiKey: '',
  aiProvider: 'anthropic',
  openaiApiKey: '',
  deepseekApiKey: '',
  valuationResult: null,
  isValuating: false,

  setCompanyData: (data) => set({ companyData: data, error: null }),

  setCompanies: (list) => set({ companies: list }),

  loadCompany: async (filename) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/companies/${encodeURIComponent(filename)}`);
      if (!res.ok) throw new Error('기업 데이터를 불러올 수 없습니다.');
      const data = await res.json();
      set({ companyData: data, selectedCompany: filename, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
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

  setApiKey: (key) => set({ apiKey: key }),

  setDartApiKey: (key) => set({ dartApiKey: key }),

  setAiProvider: (provider) => set({ aiProvider: provider }),

  setOpenaiApiKey: (key) => set({ openaiApiKey: key }),

  setDeepseekApiKey: (key) => set({ deepseekApiKey: key }),

  setValuationResult: (result) => set({ valuationResult: result }),

  setIsValuating: (v) => set({ isValuating: v }),

  clearData: () => set({ companyData: null, selectedCompany: null, valuationResult: null, error: null }),

  setError: (err) => set({ error: err }),
}));
