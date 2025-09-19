"use client";

import { AuthForm } from "@/components/auth/AuthForm";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    // ログイン成功時は作業記録画面にリダイレクト
    router.push('/work-record');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            サインイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            アカウントにログインしてください
          </p>
        </div>
        <AuthForm onSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
}
