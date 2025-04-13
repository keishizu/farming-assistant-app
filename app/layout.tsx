import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import Navigation from '@/components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '農業アシスタント',
  description: '毎日の農作業をサポート',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${inter.className} bg-[#F7F9F4]`}>
        <main className="min-h-screen pb-16">
          {children}
        </main>
        <Navigation />
        <Toaster />
      </body>
    </html>
  );
}