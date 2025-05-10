"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F9F4]">
      <div className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">農業アシスタント</h1>
          <p className="mt-2 text-gray-600">アカウントを作成</p>
        </div>
        {/* 型エラーを避けてlocaleを適用 */}
        <SignUp
          {...({
            locale: "ja-JP",
            appearance: {
              elements: {
                formButtonPrimary:
                  "bg-green-600 hover:bg-green-700 text-sm normal-case",
                card: "bg-white shadow-none",
                headerTitle: "text-gray-900",
                headerSubtitle: "text-gray-600",
                socialButtonsBlockButton:
                  "border border-gray-300 hover:bg-gray-50 text-gray-700",
                formFieldLabel: "text-gray-700",
                formFieldInput:
                  "border border-gray-300 focus:border-green-500 focus:ring-green-500",
                footerActionLink: "text-green-600 hover:text-green-700",
              },
            },
            afterSignUpUrl: "/",
            signInUrl: "/sign-in",
          } as any)}
        />
      </div>
    </div>
  );
}
