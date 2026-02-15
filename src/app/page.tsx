'use client';

import { useCompanyStore } from '@/store/company-store';

export default function HomePage() {
  const { companyData } = useCompanyStore();

  if (companyData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          {companyData.company_name} 데이터가 로드되었습니다.
        </h2>
        <p className="text-gray-500">왼쪽 목차에서 분석 슬라이드를 선택해주세요.</p>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <div className="max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">기업 재무 분석 시스템</h2>
        <p className="text-gray-500 mb-8">
          왼쪽 사이드바에서 기업을 선택하거나, JSON/PDF 파일을 업로드하여 재무 분석을 시작하세요.
        </p>
        <div className="grid grid-cols-3 gap-4 text-left">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-indigo-600 mb-1">JSON 업로드</h3>
            <p className="text-xs text-gray-500">기존 분석 데이터를 바로 로드합니다.</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-indigo-600 mb-1">PDF 분석</h3>
            <p className="text-xs text-gray-500">재무제표 PDF를 AI로 구조화합니다.</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-indigo-600 mb-1">DART 조회</h3>
            <p className="text-xs text-gray-500">상장기업 공시 데이터를 조회합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
