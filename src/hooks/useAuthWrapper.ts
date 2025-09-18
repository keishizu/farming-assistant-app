"use client";

import { useAuth as useSupabaseAuth } from './useAuth';
import { useCallback } from 'react';

// 認証システムを統合するラッパーフック
export function useAuthWrapper() {
  const useSupabaseAuthMode = process.env.NEXT_PUBLIC_USE_SUPABASE_AUTH === 'true';
  
  // Supabase認証
  const supabaseAuth = useSupabaseAuth();
  
  // getToken関数をメモ化
  const getToken = useCallback(async (options?: { template?: string }) => {
    if (!supabaseAuth.session?.access_token) {
      throw new Error("No access token available");
    }
    return supabaseAuth.session.access_token;
  }, [supabaseAuth.session?.access_token]);
  
  if (useSupabaseAuthMode) {
    return {
      userId: supabaseAuth.user?.id || null,
      isLoaded: !supabaseAuth.loading,
      isSignedIn: !!supabaseAuth.user,
      getToken,
      signOut: supabaseAuth.signOut,
      user: supabaseAuth.user,
      session: supabaseAuth.session,
    };
  }
  
  // Clerk認証モードの場合は、Clerkのフックを動的にインポート
  // この部分は実際には使用されないが、型チェックのために必要
  return {
    userId: null,
    isLoaded: false,
    isSignedIn: false,
    getToken: useCallback(async () => {
      throw new Error("Clerk auth not available in Supabase mode");
    }, []),
    signOut: useCallback(async () => {
      throw new Error("Clerk auth not available in Supabase mode");
    }, []),
    user: null,
    session: null,
  };
}
