'use client';

import { useState, useRef, useCallback } from 'react';
import { useCompanyStore } from '@/store/company-store';
import { downloadPdf, downloadFullReportPdf } from '@/lib/pdf-generator';
import FullReportContent from '@/components/pdf/FullReportContent';
import { COLOR_PALETTE } from '@/components/charts/chartConfig';

export default function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
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
      <div
        className="px-4 md:px-6 py-4 md:py-5 rounded-xl shadow-lg mb-4 md:mb-6 flex items-center justify-between gap-2"
        style={{ background: `linear-gradient(to right, ${COLOR_PALETTE.headerFrom}, ${COLOR_PALETTE.headerVia}, ${COLOR_PALETTE.headerTo})` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuToggle}
            className="md:hidden text-white p-1 -ml-1 flex-shrink-0"
            aria-label="메뉴 열기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg md:text-2xl font-extrabold text-white drop-shadow-md truncate">
            {companyName} 재무 분석
          </h1>
        </div>
        {companyData && (
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
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
