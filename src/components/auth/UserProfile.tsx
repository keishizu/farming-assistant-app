"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Loader2, 
  User, 
  LogOut, 
  Settings, 
  Mail, 
  Calendar,
  Edit3,
  Save,
  X
} from "lucide-react";

interface UserProfileProps {
  showDropdown?: boolean;
  className?: string;
}

export function UserProfile({ showDropdown = true, className }: UserProfileProps) {
  const { user, signOut, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignOut = async () => {
    setIsLoading(true);
    const { error } = await signOut();
    if (error) {
      setError(error.message);
    }
    setIsLoading(false);
  };

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      setError("表示名を入力してください。");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await updateProfile({ display_name: displayName });
    if (error) {
      setError(error.message);
    } else {
      setSuccess("プロフィールを更新しました。");
      setIsEditing(false);
    }
    setIsLoading(false);
  };

  const handleCancelEdit = () => {
    setDisplayName(user?.user_metadata?.display_name || "");
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>読み込み中...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userDisplayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'ユーザー';
  const userEmail = user.email || '';
  const userAvatar = user.user_metadata?.avatar_url || '';

  if (showDropdown) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userAvatar} alt={userDisplayName} />
              <AvatarFallback>{getInitials(userDisplayName)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userDisplayName}</p>
              <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsEditing(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>プロフィール設定</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            <span>サインアウト</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          プロフィール
        </CardTitle>
        <CardDescription>
          アカウント情報の確認と編集
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* アバターと基本情報 */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={userAvatar} alt={userDisplayName} />
            <AvatarFallback className="text-lg">{getInitials(userDisplayName)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="text-lg font-medium">{userDisplayName}</h3>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
        </div>

        {/* 表示名の編集 */}
        <div className="space-y-2">
          <Label htmlFor="display-name">表示名</Label>
          {isEditing ? (
            <div className="flex space-x-2">
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="表示名を入力"
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleUpdateProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-sm">{userDisplayName}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* アカウント情報 */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">メールアドレス:</span>
            <span>{userEmail}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">登録日:</span>
            <span>{user.created_at ? formatDate(user.created_at) : '不明'}</span>
          </div>
        </div>

        {/* エラー・成功メッセージ */}
        {error && (
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        {/* サインアウトボタン */}
        <Button 
          variant="outline" 
          onClick={handleSignOut} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4 mr-2" />
          )}
          サインアウト
        </Button>
      </CardContent>
    </Card>
  );
}
