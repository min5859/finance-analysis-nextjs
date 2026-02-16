'use client';

import { useState, useRef, useCallback } from 'react';
import { useCompanyStore } from '@/store/company-store';
import { downloadPdf, downloadFullReportPdf } from '@/lib/pdf-generator';
import FullReportContent from '@/components/pdf/FullReportContent';

export default function Header() {
  const companyData = useCompanyStore((s) => s.companyData);
  const companyName = companyData?.company_name || '기업 재무';
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFullReport, setIsFullReport] = useState(false);
  const [progress, setProgress] = useState('');
  const fullReportRef = useRef<HTMLDivElement>(null);

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

  const handleFullReport = useCallback(async () => {
    setIsFullReport(true);
    setIsGenerating(true);
    setProgress('렌더링 준비 중...');
  }, []);

  const startCapture = useCallback(async () => {
    if (!fullReportRef.current) return;

    // Wait for Chart.js and other components to render
    await new Promise((r) => {
      requestAnimationFrame(() => setTimeout(r, 1500));
    });

    setProgress('PDF 생성 중...');
    try {
      await downloadFullReportPdf(fullReportRef.current, {
        companyName,
        onProgress: (current, total) => {
          setProgress(`PDF 생성 중... (${current}/${total})`);
        },
      });
    } finally {
      setIsFullReport(false);
      setIsGenerating(false);
      setProgress('');
    }
  }, [companyName]);

  // Trigger capture after the hidden container mounts
  const containerRefCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        (fullReportRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        startCapture();
      }
    },
    [startCapture],
  );

  return (
    <>
      <div className="bg-gradient-to-r from-[#0a1172] via-[#1a237e] to-[#283593] px-6 py-5 rounded-xl shadow-lg mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-white drop-shadow-md">
          {companyName} 재무 분석
        </h1>
        {companyData && (
          <div className="flex items-center gap-3">
            {progress && (
              <span className="text-xs text-white/70">{progress}</span>
            )}
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="text-sm text-white border border-white/50 px-4 py-1.5 rounded-lg hover:bg-white/10 disabled:opacity-50 transition-colors"
            >
              {isGenerating && !isFullReport ? '생성 중...' : 'PDF 다운로드'}
            </button>
            <button
              onClick={handleFullReport}
              disabled={isGenerating}
              className="text-sm text-white bg-white/20 border border-white/50 px-4 py-1.5 rounded-lg hover:bg-white/30 disabled:opacity-50 transition-colors"
            >
              {isFullReport ? '생성 중...' : '전체 리포트'}
            </button>
          </div>
        )}
      </div>

      {/* Off-screen hidden container for full report rendering */}
      {isFullReport && (
        <div
          style={{
            position: 'fixed',
            left: -9999,
            top: 0,
            width: 1200,
            overflow: 'hidden',
          }}
          aria-hidden="true"
        >
          <FullReportContent ref={containerRefCallback} />
        </div>
      )}
    </>
  );
}
