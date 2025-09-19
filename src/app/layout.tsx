import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import Navigation from '@/components/Navigation';
import { AuthButtons } from '@/components/auth/AuthButtons';
import { AuthProvider } from '@/components/auth/AuthProvider';

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
        <AuthProvider>
          <header className="flex justify-end items-center p-4 gap-4 h-16 ml-20">
            <AuthButtons />
          </header>
          <main className="min-h-screen ml-20">
            {children}
          </main>
          <Navigation />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
