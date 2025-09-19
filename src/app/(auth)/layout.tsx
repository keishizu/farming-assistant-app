"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // デバッグ用ログ
  console.log('AuthLayout render:', { isAuthenticated, loading });

  useEffect(() => {
    console.log('AuthLayout useEffect triggered:', { isAuthenticated, loading });
    if (!loading && !isAuthenticated) {
      console.log('User not authenticated, will redirect to sign-in after delay');
      // 認証状態の更新を待つため、少し遅延を追加
      const timer = setTimeout(() => {
        console.log('Redirecting to sign-in');
        router.push("/sign-in");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, loading, router]);

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

  if (!isAuthenticated) {
    return null; // リダイレクト中
  }

  return <>{children}</>;
}
