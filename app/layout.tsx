import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '단체 게임 퀴즈',
  description: '친구들끼리 모여서 하는 팀 대항 퀴즈. 화면에 띄워놓고 키보드로 넘기면 됩니다.',
};

export const viewport: Viewport = {
  themeColor: '#14101c',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
