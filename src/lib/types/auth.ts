import { User, Session, AuthError } from "@supabase/supabase-js";

// 認証状態の型定義
export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
}

// 認証アクションの型定義
export interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ data: any; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ data: any; error: AuthError | null }>;
  updateProfile: (updates: { display_name?: string; avatar_url?: string }) => Promise<{ data: any; error: AuthError | null }>;
  getToken: (options?: { template?: string }) => Promise<string>;
}

// 認証フックの戻り値の型定義
export type AuthHookReturn = AuthState & AuthActions;

// 認証コンテキストの型定義
export interface AuthContextType extends AuthHookReturn {
  // 追加のコンテキスト固有のプロパティがあればここに定義
}

// 認証ラッパーの型定義
export interface AuthWrapperReturn {
  userId: string | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  getToken: (options?: { template?: string }) => Promise<string>;
  signOut: () => Promise<{ error: AuthError | null }>;
  user: User | null;
  session: Session | null;
}

// プロフィール更新の型定義
export interface ProfileUpdateData {
  display_name?: string;
  avatar_url?: string;
}

// 認証エラーの型定義
export type AuthErrorType = AuthError | null;

// 認証レスポンスの型定義
export interface AuthResponse<T = any> {
  data: T | null;
  error: AuthError | null;
}
