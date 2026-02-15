'use client';

import { useCompanyStore } from '@/store/company-store';

export default function Header() {
  const companyData = useCompanyStore((s) => s.companyData);
  const companyName = companyData?.company_name || '기업 재무';

  return (
    <div className="bg-gradient-to-r from-[#0a1172] via-[#1a237e] to-[#283593] px-6 py-5 rounded-xl shadow-lg mb-6 text-center">
      <h1 className="text-2xl font-extrabold text-white drop-shadow-md">
        {companyName} 재무 분석
      </h1>
    </div>
  );
}
