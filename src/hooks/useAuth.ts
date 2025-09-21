"use client";

import { useEffect, useState, useCallback } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { AuthState, AuthActions, AuthHookReturn, ProfileUpdateData } from "@/lib/types/auth";
import { getSupabaseClient } from "@/lib/supabase";

const useSupabaseAuth = process.env.NEXT_PUBLIC_USE_SUPABASE_AUTH !== 'false';

// 環境変数のチェック
const hasValidSupabaseConfig = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-key'
);

// シングルトンのSupabaseクライアントを使用（環境変数が有効な場合のみ）
const supabase = hasValidSupabaseConfig ? getSupabaseClient() : null;

// 型定義は src/lib/types/auth.ts からインポート

export function useAuth(): AuthHookReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 認証フラグがfalseの場合は何もしない
  const isAuthEnabled = useSupabaseAuth;

  // 認証状態の変更を監視
  useEffect(() => {
    if (!isAuthEnabled || !supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    // 初期セッション取得
    const initializeAuth = async () => {
      if (!supabase) return;
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (mounted) {
          if (error) {
            console.error('Session error:', error);
            setError(error);
            setSession(null);
            setUser(null);
            setIsAuthenticated(false);
          } else {
            console.log('Initial session loaded:', !!session, session?.user?.id);
            setSession(session);
            setUser(session?.user ?? null);
            setIsAuthenticated(!!session && !!session.user);
            setError(null);
          }
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          console.error('Session error:', err);
          setError(err as AuthError);
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    if (!supabase) return;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setSession(null);
          setIsAuthenticated(false);
          setError(null);
          if (event === 'SIGNED_OUT') {
            window.location.href = '/';
          }
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          setIsAuthenticated(!!session && !!session.user);
          setError(null);
          
          if (event === 'SIGNED_IN') {
            console.log('SIGNED_IN event detected, current path:', window.location.pathname);
            const publicRoutes = ['/', '/sign-in', '/sign-up', '/auth/callback'];
            const isPublicRoute = publicRoutes.includes(window.location.pathname) || window.location.pathname.startsWith('/auth/');
            
            if (isPublicRoute) {
              console.log('Redirecting to work-record from public route');
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
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isAuthEnabled]);

  // ログイン
  const signIn = useCallback(async (email: string, password: string) => {
    if (!isAuthEnabled || !supabase) {
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

  // 新規登録
  const signUp = useCallback(async (email: string, password: string) => {
    if (!isAuthEnabled || !supabase) {
      return { data: null, error: { message: '認証が無効になっています' } as AuthError };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/work-record`
        }
      });
      
      if (error) {
        setError(error);
        return { data, error };
      }
      
      // 新規登録成功時の処理
      if (data.user) {
        // セッションが作成された場合（メール確認が不要な場合）
        if (data.session) {
          console.log('User created and session established immediately');
          setUser(data.user);
          setSession(data.session);
          setIsAuthenticated(true);
          return { data, error: null };
        } else {
          // メール確認が必要な場合
          console.log('Email confirmation required');
          return { 
            data, 
            error: null,
            message: '確認メールを送信しました。メールボックスを確認してください。'
          };
        }
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

  // Googleでログイン
  const signInWithGoogle = useCallback(async () => {
    if (!isAuthEnabled || !supabase) {
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
    if (!isAuthEnabled || !supabase) {
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
    if (!isAuthEnabled || !supabase) {
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
    if (!isAuthEnabled || !user || !supabase) {
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
