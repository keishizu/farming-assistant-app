"use client";

import { AuthForm } from "@/components/auth/AuthForm";
import { useRouter } from "next/navigation";

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    // ログイン成功時は作業記録画面にリダイレクト
    router.push('/work-record');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9F4]">
      <div className="max-w-md w-full space-y-8 px-4">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-green-800">
            アカウント作成
          </h2>
          <p className="mt-2 text-sm text-green-700">
            新しいアカウントを作成してください
          </p>
        </div>
        <AuthForm onSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
}
