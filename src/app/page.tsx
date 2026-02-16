'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useCompanyStore } from '@/store/company-store';
import type { CompanyFinancialData } from '@/types/company';

type Step = 'idle' | 'uploading' | 'detecting' | 'extracting' | 'saving' | 'done' | 'error';

interface DetectedPage {
  pageNumber: number;
  statementType: string;
  score: number;
  matchedAccounts: number;
}

interface ProcessState {
  step: Step;
  message: string;
  detectedPages: DetectedPage[];
  totalPages: number;
  result: CompanyFinancialData | null;
  error: string | null;
}

const STEP_LABELS: Record<Step, string> = {
  idle: '',
  uploading: '파일 업로드 중...',
  detecting: '재무제표 페이지 탐지 중...',
  extracting: 'AI 분석 중... (1~2분 소요)',
  saving: '데이터 저장 중...',
  done: '완료!',
  error: '오류 발생',
};

const STEPS_ORDER: Step[] = ['uploading', 'detecting', 'extracting', 'saving', 'done'];

export default function HomePage() {
  const { companyData, setCompanyData, loadCompanyList, aiProvider } = useCompanyStore();
  const [state, setState] = useState<ProcessState>({
    step: 'idle',
    message: '',
    detectedPages: [],
    totalPages: 0,
    result: null,
    error: null,
  });

  const resetState = useCallback(() => {
    setState({
      step: 'idle',
      message: '',
      detectedPages: [],
      totalPages: 0,
      result: null,
      error: null,
    });
  }, []);

  const processJsonFile = useCallback(
    async (file: File) => {
      setState((s) => ({ ...s, step: 'uploading', message: 'JSON 파일 파싱 중...' }));

      const text = await file.text();
      const data = JSON.parse(text) as CompanyFinancialData;

      if (!data.company_name) {
        throw new Error('company_name 필드가 없습니다.');
      }

      // 서버에 저장
      setState((s) => ({ ...s, step: 'saving', message: '데이터 저장 중...' }));
      const saveRes = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!saveRes.ok) throw new Error('데이터 저장 실패');

      setCompanyData(data);
      await loadCompanyList();

      setState((s) => ({ ...s, step: 'done', message: '완료!', result: data }));
    },
    [setCompanyData, loadCompanyList],
  );

  const processPdfFile = useCallback(
    async (file: File) => {
      // 1. 업로드 + 페이지 탐지
      setState((s) => ({ ...s, step: 'uploading', message: '파일 업로드 중...' }));

      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || '업로드 실패');
      }

      const uploadData = await uploadRes.json();

      setState((s) => ({
        ...s,
        step: 'detecting',
        message: `${uploadData.totalPages}페이지 중 ${uploadData.detectedPages.length}개 재무제표 페이지 탐지`,
        detectedPages: uploadData.detectedPages,
        totalPages: uploadData.totalPages,
      }));

      // 2. AI 구조화
      setState((s) => ({ ...s, step: 'extracting', message: 'AI 분석 중... (1~2분 소요)' }));

      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: uploadData.text,
          type: 'pdf_text',
          provider: aiProvider,
        }),
      });
      if (!extractRes.ok) {
        const err = await extractRes.json();
        throw new Error(err.error || 'AI 분석 실패');
      }

      const extractData = await extractRes.json();
      const companyResult = extractData.data as CompanyFinancialData;

      // 3. 저장
      setState((s) => ({ ...s, step: 'saving', message: '데이터 저장 중...' }));

      const saveRes = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyResult),
      });
      if (!saveRes.ok) throw new Error('데이터 저장 실패');

      setCompanyData(companyResult);
      await loadCompanyList();

      setState((s) => ({ ...s, step: 'done', message: '완료!', result: companyResult }));
    },
    [setCompanyData, loadCompanyList, aiProvider],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      resetState();

      try {
        if (file.name.endsWith('.json')) {
          await processJsonFile(file);
        } else if (file.name.endsWith('.pdf')) {
          await processPdfFile(file);
        } else {
          throw new Error('PDF 또는 JSON 파일만 지원합니다.');
        }
      } catch (err) {
        setState((s) => ({
          ...s,
          step: 'error',
          error: err instanceof Error ? err.message : String(err),
        }));
      }
    },
    [resetState, processJsonFile, processPdfFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/json': ['.json'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: state.step !== 'idle' && state.step !== 'done' && state.step !== 'error',
  });

  const handleDownloadJson = useCallback(() => {
    if (!state.result) return;
    const blob = new Blob([JSON.stringify(state.result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.result.company_name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.result]);

  // 데이터 로드 완료 상태
  if (companyData && state.step === 'idle') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          {companyData.company_name} 데이터가 로드되었습니다.
        </h2>
        <p className="text-gray-500">왼쪽 목차에서 분석 슬라이드를 선택해주세요.</p>
      </div>
    );
  }

  const isProcessing = !['idle', 'done', 'error'].includes(state.step);

  return (
    <div className="py-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">기업 재무 분석 시스템</h2>
        <p className="text-gray-500 mb-8 text-center">
          JSON/PDF 파일을 업로드하거나 사이드바에서 기업을 선택하세요.
        </p>

        {/* 드롭존 */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50'
              : isProcessing
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="text-4xl mb-3">{isDragActive ? '\u{1F4E5}' : '\u{1F4C4}'}</div>
          {isDragActive ? (
            <p className="text-indigo-600 font-medium">파일을 놓아주세요</p>
          ) : isProcessing ? (
            <p className="text-gray-400">처리 중...</p>
          ) : (
            <>
              <p className="text-gray-600 font-medium">파일을 드래그하거나 클릭하여 선택</p>
              <p className="text-sm text-gray-400 mt-1">PDF (재무제표) 또는 JSON (분석 데이터) / 최대 10MB</p>
            </>
          )}
        </div>

        {/* 진행 상태 */}
        {state.step !== 'idle' && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
            {/* 단계 진행 바 */}
            <div className="flex items-center gap-1 mb-5">
              {STEPS_ORDER.map((step, i) => {
                const stepIdx = STEPS_ORDER.indexOf(state.step);
                const isActive = step === state.step;
                const isCompleted = state.step === 'error' ? false : stepIdx > i;
                return (
                  <div key={step} className="flex-1">
                    <div
                      className={`h-1.5 rounded-full transition-colors ${
                        isActive
                          ? 'bg-indigo-500'
                          : isCompleted
                            ? 'bg-indigo-400'
                            : 'bg-gray-200'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* 현재 단계 메시지 */}
            <div className="flex items-center gap-3 mb-4">
              {isProcessing && (
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              )}
              {state.step === 'done' && <span className="text-green-600 text-lg">{'\u2705'}</span>}
              {state.step === 'error' && <span className="text-red-500 text-lg">{'\u274C'}</span>}
              <span className={`font-medium ${state.step === 'error' ? 'text-red-600' : 'text-gray-700'}`}>
                {STEP_LABELS[state.step]}
              </span>
            </div>

            {/* 상세 메시지 */}
            {state.message && state.step !== 'error' && (
              <p className="text-sm text-gray-500 mb-3">{state.message}</p>
            )}

            {/* 탐지된 페이지 정보 */}
            {state.detectedPages.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-xs font-medium text-gray-600 mb-2">탐지된 재무제표 페이지</p>
                <div className="flex flex-wrap gap-2">
                  {state.detectedPages.map((dp) => (
                    <span
                      key={dp.pageNumber}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded border border-gray-200 text-xs"
                    >
                      <span className="font-medium text-indigo-600">p.{dp.pageNumber}</span>
                      <span className="text-gray-400">{dp.statementType}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 에러 */}
            {state.step === 'error' && state.error && (
              <div className="bg-red-50 rounded-lg p-3 mb-3">
                <p className="text-sm text-red-600">{state.error}</p>
              </div>
            )}

            {/* 완료 액션 */}
            {state.step === 'done' && state.result && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleDownloadJson}
                  className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  JSON 다운로드
                </button>
                <a
                  href="/summary"
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  분석 시작
                </a>
              </div>
            )}

            {/* 에러 재시도 */}
            {state.step === 'error' && (
              <button
                onClick={resetState}
                className="mt-3 px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                다시 시도
              </button>
            )}
          </div>
        )}

        {/* 안내 카드 */}
        {state.step === 'idle' && (
          <div className="grid grid-cols-3 gap-4 text-left mt-8">
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
        )}
      </div>
    </div>
  );
}
