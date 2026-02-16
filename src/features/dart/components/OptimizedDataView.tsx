import type { DartFinancialItem } from '@/types/dart';
import { convertToBillion } from '@/lib/format';
import { KEY_ACCOUNTS } from '../constants';

interface OptimizedDataViewProps {
  items: DartFinancialItem[];
  corpName: string;
  year: string;
}

export default function OptimizedDataView({ items, corpName, year }: OptimizedDataViewProps) {
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
