"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState, useCallback } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const useSupabaseAuth = process.env.NEXT_PUBLIC_USE_SUPABASE_AUTH === 'true';

// Supabaseクライアント（セッション永続化設定付き）
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ data: any; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ data: any; error: AuthError | null }>;
  updateProfile: (updates: { display_name?: string; avatar_url?: string }) => Promise<{ data: any; error: AuthError | null }>;
}

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

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
        setError(null);
      }
    } catch (err) {
      console.error('Session error:', err);
      setError(err as AuthError);
      setSession(null);
      setUser(null);
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
        console.log('Auth state changed:', event, session?.user?.id);
        
        // セッションが失われた場合は明示的にログアウト状態にする
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setSession(null);
          setError(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          setError(null);
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
  const updateProfile = useCallback(async (updates: { display_name?: string; avatar_url?: string }) => {
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

  return {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
  };
}
