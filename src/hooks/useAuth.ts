"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState, useCallback } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { AuthState, AuthActions, AuthHookReturn, ProfileUpdateData } from "@/lib/types/auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const useSupabaseAuth = process.env.NEXT_PUBLIC_USE_SUPABASE_AUTH === 'true';

// Supabaseクライアント（セッション永続化設定付き）
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// 型定義は src/lib/types/auth.ts からインポート

export function useAuth(): AuthHookReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 認証フラグがfalseの場合は何もしない
  const isAuthEnabled = useSupabaseAuth;

  // 現在のセッションを取得
  const getSession = useCallback(async () => {
    if (!isAuthEnabled) {
      setLoading(false);
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session error:', error);
        setError(error);
        setSession(null);
        setUser(null);
      } else {
        console.log('Session loaded:', !!session, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session && !!session.user);
        setError(null);
      }
    } catch (err) {
      console.error('Session error:', err);
      setError(err as AuthError);
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [isAuthEnabled]);

  // 認証状態の変更を監視
  useEffect(() => {
    if (!isAuthEnabled) {
      setLoading(false);
      return;
    }

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id, 'isAuthenticated will be:', !!session && !!session.user);
        
        // セッションが失われた場合は明示的にログアウト状態にする
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setSession(null);
          setIsAuthenticated(false);
          setError(null);
          // サインアウト時はログイン画面にリダイレクト
          if (event === 'SIGNED_OUT') {
            window.location.href = '/';
          }
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          setIsAuthenticated(!!session && !!session.user);
          setError(null);
          console.log('Auth state updated - isAuthenticated:', !!session && !!session.user);
          // ログイン成功時は作業記録画面にリダイレクト
          if (event === 'SIGNED_IN') {
            console.log('SIGNED_IN event detected, current path:', window.location.pathname);
            // パブリックルート（認証不要なページ）にいる場合のみリダイレクト
            const publicRoutes = ['/', '/sign-in', '/sign-up', '/auth/callback'];
            const isPublicRoute = publicRoutes.includes(window.location.pathname) || window.location.pathname.startsWith('/auth/');
            
            if (isPublicRoute) {
              console.log('Redirecting to work-record from public route');
              // 少し遅延を入れて、認証状態の更新を確実にする
              setTimeout(() => {
                window.location.href = '/work-record';
              }, 200);
            }
          }
        }
        
        setLoading(false);
      }
    );

    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [getSession, isAuthEnabled]);

  // サインイン
  const signIn = useCallback(async (email: string, password: string) => {
    if (!isAuthEnabled) {
      return { data: null, error: { message: '認証が無効になっています' } as AuthError };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setError(error);
      }
      
      return { data, error };
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      return { data: null, error: authError };
    } finally {
      setLoading(false);
    }
  }, [isAuthEnabled]);

  // サインアップ
  const signUp = useCallback(async (email: string, password: string) => {
    if (!isAuthEnabled) {
      return { data: null, error: { message: '認証が無効になっています' } as AuthError };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        setError(error);
      }
      
      return { data, error };
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      return { data: null, error: authError };
    } finally {
      setLoading(false);
    }
  }, [isAuthEnabled]);

  // Googleでサインイン
  const signInWithGoogle = useCallback(async () => {
    if (!isAuthEnabled) {
      return { data: null, error: { message: '認証が無効になっています' } as AuthError };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        setError(error);
      }
      
      return { data, error };
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      return { data: null, error: authError };
    } finally {
      setLoading(false);
    }
  }, [isAuthEnabled]);

  // サインアウト
  const signOut = useCallback(async () => {
    if (!isAuthEnabled) {
      return { error: { message: '認証が無効になっています' } as AuthError };
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError(error);
      } else {
        // サインアウト成功時はログイン画面にリダイレクト
        window.location.href = '/';
      }
      
      return { error };
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      return { error: authError };
    } finally {
      setLoading(false);
    }
  }, [isAuthEnabled]);

  // パスワードリセット
  const resetPassword = useCallback(async (email: string) => {
    if (!isAuthEnabled) {
      return { data: null, error: { message: '認証が無効になっています' } as AuthError };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        setError(error);
      }
      
      return { data, error };
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      return { data: null, error: authError };
    } finally {
      setLoading(false);
    }
  }, [isAuthEnabled]);

  // プロフィール更新
  const updateProfile = useCallback(async (updates: ProfileUpdateData) => {
    if (!isAuthEnabled || !user) {
      return { data: null, error: { message: '認証が無効になっています' } as AuthError };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });
      
      if (error) {
        setError(error);
      }
      
      return { data, error };
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      return { data: null, error: authError };
    } finally {
      setLoading(false);
    }
  }, [isAuthEnabled, user]);

  // トークン取得
  const getToken = useCallback(async (options?: { template?: string }) => {
    if (!session?.access_token) {
      throw new Error("No access token available");
    }
    return session.access_token;
  }, [session?.access_token]);

  return {
    user,
    session,
    loading,
    error,
    isAuthenticated,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    getToken,
  };
}
