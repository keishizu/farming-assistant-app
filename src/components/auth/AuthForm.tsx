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
import { GoogleSignInButton } from "./GoogleSignInButton";
import { SupabaseGoogleSignInButton } from "./SupabaseGoogleSignInButton";

interface AuthFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function AuthForm({ onSuccess, className }: AuthFormProps) {
  const { signIn, signUp, signInWithGoogle, loading, error } = useAuth();
  const useSupabaseAuth = process.env.NEXT_PUBLIC_USE_SUPABASE_AUTH === 'true';
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    if (!email || !password) {
      setFormError("メールアドレスとパスワードを入力してください。");
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(email, password);
    if (error) {
      setFormError(error.message);
      setIsLoading(false);
    } else {
      // 認証成功時は少し待ってからリダイレクト
      setTimeout(() => {
        onSuccess?.();
      }, 100);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    if (!email || !password || !confirmPassword) {
      setFormError("すべての項目を入力してください。");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setFormError("パスワードが一致しません。");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setFormError("パスワードは6文字以上で入力してください。");
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password);
    if (error) {
      setFormError(error.message);
    } else {
      setFormError("確認メールを送信しました。メールボックスを確認してください。");
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setFormError(null);

    const { error } = await signInWithGoogle();
    if (error) {
      setFormError(error.message);
      setIsLoading(false);
    } else {
      // Googleサインイン成功時は少し待ってからリダイレクト
      setTimeout(() => {
        onSuccess?.();
      }, 100);
    }
  };

  const displayError = formError || error?.message;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>認証</CardTitle>
        <CardDescription>
          アカウントにサインインまたは新規登録してください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">サインイン</TabsTrigger>
            <TabsTrigger value="signup">サインアップ</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="space-y-4">
            {/* Googleサインイン */}
            <div className="space-y-4">
              {useSupabaseAuth ? (
                <SupabaseGoogleSignInButton 
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full"
                >
                  Googleでサインイン
                </SupabaseGoogleSignInButton>
              ) : (
                <GoogleSignInButton 
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full"
                >
                  Googleでサインイン
                </GoogleSignInButton>
              )}
              
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

            {/* メール/パスワードサインイン */}
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
                <Alert>
                  <AlertDescription>{displayError}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                サインイン
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            {/* Googleサインアップ */}
            <div className="space-y-4">
              {useSupabaseAuth ? (
                <SupabaseGoogleSignInButton 
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full"
                >
                  Googleでサインアップ
                </SupabaseGoogleSignInButton>
              ) : (
                <GoogleSignInButton 
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full"
                >
                  Googleでサインアップ
                </GoogleSignInButton>
              )}
              
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

            {/* メール/パスワードサインアップ */}
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
                <Alert>
                  <AlertDescription>{displayError}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                サインアップ
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
