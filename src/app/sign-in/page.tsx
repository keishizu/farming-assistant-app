"use client";

import { AuthForm } from "@/components/auth/AuthForm";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// useSearchParams を使用するコンポーネントを分離
function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    if (error) {
      setErrorMessage(error);
    } else if (message) {
      setErrorMessage(decodeURIComponent(message));
    }
  }, [searchParams]);

  const handleLoginSuccess = () => {
    // ログイン成功時は作業記録画面にリダイレクト
    router.push('/work-record');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9F4]">
      <div className="max-w-md w-full space-y-8 px-4">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-green-800">
            ログイン
          </h2>
          <p className="mt-2 text-sm text-green-700">
            アカウントにログインしてください
          </p>
        </div>
        {errorMessage && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{errorMessage}</AlertDescription>
          </Alert>
        )}
        <AuthForm onSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
}

// ローディングフォールバックコンポーネント
function SignInLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9F4]">
      <div className="max-w-md w-full space-y-8 px-4">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-green-800">
            ログイン
          </h2>
          <p className="mt-2 text-sm text-green-700">
            アカウントにログインしてください
          </p>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInContent />
    </Suspense>
  );
}
