"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { UserProfile } from "./UserProfile";
import { AuthForm } from "./AuthForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AuthButtonsProps {
  className?: string;
}

export function AuthButtons({ className }: AuthButtonsProps) {
  const { user, isAuthenticated, loading } = useAuth();

  // デバッグ用ログ
  console.log('AuthButtons render:', { user: !!user, isAuthenticated, loading });

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>読み込み中...</span>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className={className}>
        <UserProfile showDropdown={true} />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <LogIn className="h-4 w-4 mr-2" />
            サインイン
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>認証</DialogTitle>
            <DialogDescription>
              アカウントにサインインまたは新規登録してください
            </DialogDescription>
          </DialogHeader>
          <AuthForm />
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            サインアップ
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新規登録</DialogTitle>
            <DialogDescription>
              新しいアカウントを作成してください
            </DialogDescription>
          </DialogHeader>
          <AuthForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}
