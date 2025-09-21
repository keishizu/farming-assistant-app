"use client";

import { AuthForm } from '@/components/auth/AuthForm';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  // デバッグ用ログ
  console.log('Home component render:', { isAuthenticated, loading });

  const handleLoginSuccess = () => {
    // ログイン成功時は作業記録画面にリダイレクト
    router.push('/work-record');
  };

  // 認証されたユーザーは作業記録画面にリダイレクト
  // useAuthフック内でリダイレクト処理を行うため、ここでは重複を避ける
  useEffect(() => {
    console.log('Home useEffect triggered:', { isAuthenticated, loading });
    if (!loading && isAuthenticated) {
      console.log('User is authenticated, but redirect will be handled by useAuth hook');
      // useAuthフックでリダイレクト処理を行うため、ここでは何もしない
    }
  }, [isAuthenticated, loading, router]);

  // ローディング中は表示しない
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 認証されていない場合のみログイン画面を表示
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h1 className="text-center text-4xl font-bold text-green-800">
              農業支援アプリ
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600">
              農作業の記録・管理・分析をサポート
            </p>
          </div>
          <AuthForm onSuccess={handleLoginSuccess} />
        </div>
      </div>
    );
  }

  // 認証されたユーザーはリダイレクト中
  return null;
}