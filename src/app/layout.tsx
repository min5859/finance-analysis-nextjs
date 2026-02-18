import type { Metadata } from 'next';
import './globals.css';
import LayoutShell from '@/components/layout/LayoutShell';

export const metadata: Metadata = {
  title: 'Financial Analysis System',
  description: '기업 재무 분석 대시보드',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-gray-50 text-gray-900" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
