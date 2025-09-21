"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { SupabaseGoogleSignInButton } from "./SupabaseGoogleSignInButton";

interface AuthFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function AuthForm({ onSuccess, className }: AuthFormProps) {
  const { signIn, signUp, signInWithGoogle, loading: globalLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // ローディング状態を統一（グローバルローディングまたはフォームローディング）
  const isLoadingState = isLoading || globalLoading;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("signin");

  // タブ切り替え時にフォームの状態をリセット
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFormError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    // 入力値のトリム処理
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setFormError("メールアドレスとパスワードを入力してください。");
      setIsLoading(false);
      return;
    }

    // メールアドレス形式の基本チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setFormError("有効なメールアドレスを入力してください。");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signIn(trimmedEmail, trimmedPassword);
      if (error) {
        setFormError(error.message);
      } else {
        // 認証成功時は少し待ってからリダイレクト
        setTimeout(() => {
          onSuccess?.();
        }, 100);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'ログインに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    // 入力値のトリム処理
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedEmail || !trimmedPassword || !trimmedConfirmPassword) {
      setFormError("すべての項目を入力してください。");
      setIsLoading(false);
      return;
    }

    // メールアドレス形式の基本チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setFormError("有効なメールアドレスを入力してください。");
      setIsLoading(false);
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setFormError("パスワードが一致しません。");
      setIsLoading(false);
      return;
    }

    if (trimmedPassword.length < 6) {
      setFormError("パスワードは6文字以上で入力してください。");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signUp(trimmedEmail, trimmedPassword);
      if (result.error) {
        setFormError(result.error.message);
      } else if (result.message) {
        setFormError(result.message);
      } else {
        // メール確認が不要で即座に認証された場合
        setFormError("アカウントが作成されました。");
        // 認証状態の変更イベントが発火するので、手動でリダイレクトは不要
        // onSuccess?.() は認証状態変更時に自動的に呼ばれる
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '新規登録に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setFormError(null);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setFormError(error.message);
      } else {
        // Googleログイン成功時は少し待ってからリダイレクト
        setTimeout(() => {
          onSuccess?.();
        }, 100);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Googleログインに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // フォーム固有のエラーを優先し、グローバルエラーは補完的に使用
  const displayError = formError || (error?.message && !formError ? error.message : null);

  return (
    <Card className={`${className} border-green-200 shadow-lg`}>
      <CardHeader className="text-center">
        <CardDescription className="text-green-700">
          アカウントにログインまたは新規登録してください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-green-50">
            <TabsTrigger value="signin" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">ログイン</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">新規登録</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="space-y-4">
            {/* Googleログイン */}
            <div className="space-y-4">
              <SupabaseGoogleSignInButton 
                onClick={handleGoogleSignIn}
                disabled={isLoadingState}
                className="w-full"
              >
                Googleでログイン
              </SupabaseGoogleSignInButton>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    または
                  </span>
                </div>
              </div>
            </div>

            {/* メール/パスワードログイン */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">メールアドレス</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password">パスワード</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="パスワードを入力"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {displayError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{displayError}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={isLoadingState}>
                {isLoadingState && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                ログイン
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            {/* Google新規登録 */}
            <div className="space-y-4">
              <SupabaseGoogleSignInButton 
                onClick={handleGoogleSignIn}
                disabled={isLoadingState}
                className="w-full"
              >
                Googleで新規登録
              </SupabaseGoogleSignInButton>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    または
                  </span>
                </div>
              </div>
            </div>

            {/* メール/パスワード新規登録 */}
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">メールアドレス</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password">パスワード</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="パスワードを入力"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">パスワード確認</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="パスワードを再入力"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {displayError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{displayError}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={isLoadingState}>
                {isLoadingState && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                新規登録
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
