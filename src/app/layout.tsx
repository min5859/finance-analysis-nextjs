import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import LayoutShell from '@/components/layout/LayoutShell';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

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
    <html lang="ko" className={notoSansKR.className}>
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
