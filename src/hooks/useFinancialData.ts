import { useMemo } from 'react';
import { useCompanyStore } from '@/store/company-store';
import { DataLoader } from '@/lib/data-loader';

export function useFinancialData() {
  const companyData = useCompanyStore((s) => s.companyData);

  const dl = useMemo(
    () => (companyData ? new DataLoader(companyData) : null),
    [companyData]
  );

  return { companyData, dl };
}
