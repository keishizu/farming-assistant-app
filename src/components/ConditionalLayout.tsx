"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Navigation from '@/components/Navigation';
import { AuthButtons } from '@/components/auth/AuthButtons';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  
  // 認証ページ（ログイン・新規登録）かどうかを判定
  const isAuthPage = pathname === '/sign-in' || pathname === '/sign-up';
  
  // ローディング中の場合は、ナビゲーションバーとヘッダーを表示しない
  if (loading) {
    return <>{children}</>;
  }
  
  // 認証ページまたは認証されていない場合は、ナビゲーションバーとヘッダーを表示しない
  if (isAuthPage || !isAuthenticated) {
    return <>{children}</>;
  }
  
  // 認証済みの通常のページの場合は、ナビゲーションバーとヘッダーを表示
  return (
    <>
      <header className="flex justify-end items-center p-4 gap-4 h-16 ml-20">
        <AuthButtons />
      </header>
      <main className="min-h-screen ml-20">
        {children}
      </main>
      <Navigation />
    </>
  );
}
