"use client";

import { AuthForm } from "@/components/auth/AuthForm";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SignInPage() {
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
