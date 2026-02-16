'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DartFinancialItem } from '@/types/dart';
import { buildOptimizedDartJson } from '@/lib/build-optimized-dart';
import { useCompanyStore } from '@/store/company-store';

interface OptimizedDataViewProps {
  items: DartFinancialItem[];
  corpName: string;
  year: string;
}

type AnalysisStep = 'idle' | 'extracting' | 'saving' | 'loading' | 'done' | 'error';

const STEP_MESSAGES: Record<AnalysisStep, string> = {
  idle: '',
  extracting: 'AI가 재무데이터를 분석하고 있습니다...',
  saving: '분석 결과를 저장하고 있습니다...',
  loading: '기업 데이터를 불러오는 중...',
  done: '분석 완료! 대시보드로 이동합니다.',
  error: '분석 중 오류가 발생했습니다.',
};

export default function OptimizedDataView({ items, corpName, year }: OptimizedDataViewProps) {
  const router = useRouter();
  const { setCompanyData, loadCompanyList, aiProvider } = useCompanyStore();
  const [step, setStep] = useState<AnalysisStep>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const { json, text: jsonStr } = buildOptimizedDartJson(items, corpName, year);
  const tokenEstimate = Math.round(jsonStr.length / 4);

  const handleAnalysis = async () => {
    setStep('extracting');
    setErrorMsg('');

    try {
      // 1. AI 구조화
      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: jsonStr, type: 'dart_data', provider: aiProvider }),
      });
      if (!extractRes.ok) {
        const err = await extractRes.json().catch(() => ({}));
        throw new Error(err.error || `AI 분석 실패 (${extractRes.status})`);
      }
      const { data } = await extractRes.json();
      if (!data) throw new Error('AI 응답에서 데이터를 추출할 수 없습니다.');

      // 2. 저장
      setStep('saving');
      const saveRes = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}));
        throw new Error(err.error || `저장 실패 (${saveRes.status})`);
      }

      // 3. Store 반영
      setStep('loading');
      setCompanyData(data);
      await loadCompanyList();

      // 4. 이동
      setStep('done');
      router.push('/summary');
    } catch (err) {
      setStep('error');
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const isProcessing = step !== 'idle' && step !== 'error';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-indigo-50 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500">재무상태표 항목</p>
          <p className="text-2xl font-bold text-indigo-700">{json.balance_sheet.length}</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500">손익계산서 항목</p>
          <p className="text-2xl font-bold text-emerald-700">{json.income_statement.length}</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500">현금흐름표 항목</p>
          <p className="text-2xl font-bold text-amber-700">{json.cash_flow.length}</p>
        </div>
      </div>

      {/* AI 분석 버튼 */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-5 border border-indigo-100">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-800">AI 재무 분석</h4>
            <p className="text-sm text-gray-500 mt-1">
              DART 데이터를 AI가 분석하여 12개 항목의 재무 대시보드를 생성합니다
            </p>
          </div>
          <button
            onClick={handleAnalysis}
            disabled={isProcessing}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 ml-4"
          >
            {isProcessing ? '분석 중...' : 'AI 분석 시작'}
          </button>
        </div>

        {step !== 'idle' && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            {isProcessing && (
              <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            )}
            <span className={step === 'error' ? 'text-red-600' : 'text-indigo-700'}>
              {step === 'error' ? errorMsg : STEP_MESSAGES[step]}
            </span>
          </div>
        )}
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
