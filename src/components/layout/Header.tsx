'use client';

import { useState, useRef, useCallback } from 'react';
import { useCompanyStore } from '@/store/company-store';
import { downloadPdf, downloadFullReportPdf } from '@/lib/pdf-generator';
import { downloadCompanyCsv } from '@/lib/csv-export';
import { downloadCompanyPptx } from '@/lib/pptx-export';
import FullReportContent from '@/components/pdf/FullReportContent';
import { COLOR_PALETTE } from '@/components/charts/chartConfig';

export default function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const companyData = useCompanyStore((s) => s.companyData);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const companyName = companyData?.company_name || '기업 재무';
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFullReport, setIsFullReport] = useState(false);
  const [progress, setProgress] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
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

  const handleDownloadCsv = useCallback(() => {
    if (!companyData) return;
    downloadCompanyCsv(companyData);
  }, [companyData]);

  const handleDownloadPptx = useCallback(async () => {
    if (!companyData) return;
    setIsExportingPptx(true);
    try {
      await downloadCompanyPptx(companyData);
    } catch (err) {
      window.alert(`PPTX 생성 실패: ${(err as Error).message}`);
    } finally {
      setIsExportingPptx(false);
    }
  }, [companyData]);

  const handleCreateShareLink = useCallback(async () => {
    if (!selectedCompany) {
      window.alert('사이드바에서 회사를 선택한 후에 공유 링크를 생성할 수 있습니다.');
      return;
    }
    setIsSharing(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: selectedCompany }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `공유 링크 생성 실패 (HTTP ${res.status})`);
      }
      const data = (await res.json()) as { token: string };
      const url = `${window.location.origin}/share/${data.token}`;
      try {
        await navigator.clipboard.writeText(url);
        window.alert(`공유 링크가 클립보드에 복사되었습니다.\n\n${url}\n\n토큰을 가진 사람은 누구나 read-only 로 열람 가능합니다.`);
      } catch {
        window.prompt('공유 링크 (복사하세요):', url);
      }
    } catch (err) {
      window.alert((err as Error).message);
    } finally {
      setIsSharing(false);
    }
  }, [selectedCompany]);

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
              onClick={handleDownloadCsv}
              disabled={isGenerating}
              className="text-sm text-white border border-white/50 px-4 py-1.5 rounded-lg hover:bg-white/10 disabled:opacity-50 transition-colors"
              title="원본 재무 수치를 CSV(엑셀 호환)로 내보냅니다."
            >
              CSV
            </button>
            <button
              onClick={handleDownloadPptx}
              disabled={isGenerating || isExportingPptx}
              className="text-sm text-white border border-white/50 px-4 py-1.5 rounded-lg hover:bg-white/10 disabled:opacity-50 transition-colors"
              title="PowerPoint에서 그대로 편집 가능한 PPTX 파일을 생성합니다."
            >
              {isExportingPptx ? '생성 중...' : 'PPTX'}
            </button>
            <button
              onClick={handleCreateShareLink}
              disabled={isGenerating || isSharing || !selectedCompany}
              className="text-sm text-white border border-white/50 px-4 py-1.5 rounded-lg hover:bg-white/10 disabled:opacity-50 transition-colors"
              title={selectedCompany ? '비로그인 사용자가 읽기 전용으로 볼 수 있는 링크를 만듭니다.' : '회사를 사이드바에서 선택한 후 공유 가능'}
            >
              {isSharing ? '생성 중...' : '공유'}
            </button>
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
