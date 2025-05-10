import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import Navigation from '@/components/Navigation';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs' // ✅ 追加
import { jaJP } from '@clerk/localizations'

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
    <ClerkProvider localization={jaJP}> 
      <html lang="ja">
        <body className={`${inter.className} bg-[#F7F9F4]`}>
        <header className="flex justify-end items-center p-4 gap-4 h-16">
            <SignedOut>
              <SignInButton />
              <SignUpButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          <main className="min-h-screen pb-16">
            {children}
          </main>
          <Navigation />
          <Toaster />
        </body>
      </html>
    </ClerkProvider> 
  );
}
