"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // デバッグ用ログ
  console.log('AuthLayout render:', { isAuthenticated, loading });

  useEffect(() => {
    console.log('AuthLayout useEffect triggered:', { isAuthenticated, loading });
    
    // ローディング中は何もしない
    if (loading) {
      return;
    }
    
    // 認証されていない場合はリダイレクトを準備
    if (!isAuthenticated) {
      console.log('User not authenticated, preparing redirect to sign-in');
      setShouldRedirect(true);
      
      // 少し遅延を追加してリダイレクトを実行
      const timer = setTimeout(() => {
        console.log('Redirecting to sign-in');
        router.push("/sign-in");
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      // 認証されている場合はリダイレクトフラグをリセット
      setShouldRedirect(false);
    }
  }, [isAuthenticated, loading, router]);

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 認証されていない場合（リダイレクト中）
  if (!isAuthenticated || shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">認証を確認中...</p>
        </div>
      </div>
    );
  }

  // 認証済みの場合
  return <>{children}</>;
}
