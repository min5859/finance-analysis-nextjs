import type { CorpSearchResult } from '../constants';
import { REPORT_TYPES } from '../constants';

interface CorpSearchSectionProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: CorpSearchResult[];
  selectedCorp: CorpSearchResult | null;
  onSelectCorp: (corp: CorpSearchResult) => void;
  onClearResults: () => void;
  onSearch: () => void;
  year: string;
  setYear: (y: string) => void;
  reportCode: string;
  setReportCode: (c: string) => void;
  loading: boolean;
  onLoadData: () => void;
}

export default function CorpSearchSection({
  searchQuery, setSearchQuery, searchResults, selectedCorp,
  onSelectCorp, onClearResults, onSearch,
  year, setYear, reportCode, setReportCode, loading, onLoadData,
}: CorpSearchSectionProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - 1 - i));

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">기업 검색</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder="기업명 또는 종목코드 입력"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={onSearch}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
          >
            검색
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-3 max-h-48 overflow-y-auto border border-gray-200 rounded">
            {searchResults.map((corp) => (
              <button
                key={corp.corp_code}
                onClick={() => {
                  onSelectCorp(corp);
                  onClearResults();
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
                {REPORT_TYPES.map((r) => (
                  <option key={r.code} value={r.code}>{r.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={onLoadData}
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
    </>
  );
}
