'use client';

import SlideHeader from '@/components/ui/SlideHeader';
import { useDartData } from '@/hooks/useDartData';
import { TABS } from '@/features/dart/constants';
import CorpSearchSection from '@/features/dart/components/CorpSearchSection';
import FinancialTable from '@/features/dart/components/FinancialTable';
import OptimizedDataView from '@/features/dart/components/OptimizedDataView';
import AuditView from '@/features/dart/components/AuditView';

export default function DartPage() {
  const dart = useDartData();

  return (
    <div>
      <SlideHeader title="DART 재무제표 데이터" />

      <CorpSearchSection
        searchQuery={dart.searchQuery}
        setSearchQuery={dart.setSearchQuery}
        searchResults={dart.searchResults}
        selectedCorp={dart.selectedCorp}
        onSelectCorp={dart.setSelectedCorp}
        onClearResults={() => dart.setSearchResults([])}
        onSearch={dart.searchCorps}
        year={dart.year}
        setYear={dart.setYear}
        reportCode={dart.reportCode}
        setReportCode={dart.setReportCode}
        loading={dart.loading}
        onLoadData={dart.loadFinancialData}
      />

      {dart.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {dart.error}
        </div>
      )}

      {(dart.financialItems.length > 0 || dart.companyInfo) && (
        <>
          <div className="flex gap-1 border-b border-gray-200 mb-4">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => dart.setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  dart.activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {dart.activeTab === 'company' && dart.companyInfo && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">{dart.companyInfo.corp_name}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['영문명', dart.companyInfo.corp_name_eng],
                  ['종목명', dart.companyInfo.stock_name],
                  ['종목코드', dart.companyInfo.stock_code],
                  ['대표이사', dart.companyInfo.ceo_nm],
                  ['법인구분', dart.companyInfo.corp_cls === 'Y' ? '유가증권' : dart.companyInfo.corp_cls === 'K' ? '코스닥' : dart.companyInfo.corp_cls],
                  ['업종코드', dart.companyInfo.induty_code],
                  ['설립일', dart.companyInfo.est_dt],
                  ['결산월', `${dart.companyInfo.acc_mt}월`],
                ].map(([label, value]) => (
                  <div key={label} className="flex">
                    <span className="text-gray-500 w-24 shrink-0">{label}</span>
                    <span className="font-medium">{value || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(dart.activeTab === 'bs' || dart.activeTab === 'is' || dart.activeTab === 'cf') && (
            <FinancialTable
              items={dart.filterItems(dart.activeTab.toUpperCase(), false)}
              keyItems={dart.filterItems(dart.activeTab.toUpperCase(), true)}
              title={dart.activeTab === 'bs' ? '재무상태표' : dart.activeTab === 'is' ? '손익계산서' : '현금흐름표'}
            />
          )}

          {dart.activeTab === 'optimized' && (
            <OptimizedDataView items={dart.financialItems} corpName={dart.selectedCorp?.corp_name || ''} year={dart.year} />
          )}

          {dart.activeTab === 'audit' && (
            <AuditView auditData={dart.auditData} />
          )}
        </>
      )}
    </div>
  );
}
