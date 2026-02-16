'use client';

import { useState } from 'react';
import { useCompanyStore } from '@/store/company-store';
import { downloadPdf } from '@/lib/pdf-generator';

export default function Header() {
  const companyData = useCompanyStore((s) => s.companyData);
  const companyName = companyData?.company_name || '기업 재무';
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    const content = document.getElementById('pdf-content');
    if (!content) return;
    setIsGenerating(true);
    try {
      await downloadPdf(content, { companyName });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#0a1172] via-[#1a237e] to-[#283593] px-6 py-5 rounded-xl shadow-lg mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-extrabold text-white drop-shadow-md">
        {companyName} 재무 분석
      </h1>
      {companyData && (
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="text-sm text-white border border-white/50 px-4 py-1.5 rounded-lg hover:bg-white/10 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? '생성 중...' : 'PDF 다운로드'}
        </button>
      )}
    </div>
  );
}
