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
} from '@clerk/nextjs'
import { jaJP } from '@clerk/localizations'
import { SupabaseAuthButtons } from '@/components/auth/SupabaseAuthButtons';
import { AuthButtons } from '@/components/auth/AuthButtons';
import { AuthProvider } from '@/components/auth/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '農業アシスタント',
  description: '毎日の農作業をサポート',
};

// 認証システムの切り替えフラグ
const useSupabaseAuth = process.env.NEXT_PUBLIC_USE_SUPABASE_AUTH === 'true';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Supabase認証を使用する場合
  if (useSupabaseAuth) {
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

  // Clerk認証を使用する場合（既存）
  return (
    <ClerkProvider localization={jaJP}> 
      <html lang="ja">
        <body className={`${inter.className} bg-[#F7F9F4]`}>
          <header className="flex justify-end items-center p-4 gap-4 h-16 ml-20">
            <SignedOut>
              <SignInButton />
              <SignUpButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          <main className="min-h-screen ml-20">
            {children}
          </main>
          <Navigation />
          <Toaster />
        </body>
      </html>
    </ClerkProvider> 
  );
}
