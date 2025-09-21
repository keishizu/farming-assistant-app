"use client";

import { useAuth as useSupabaseAuth } from './useAuth';
import { useCallback } from 'react';
import { AuthWrapperReturn } from '@/lib/types/auth';

// Supabase認証システムのラッパーフック
export function useAuthWrapper(): AuthWrapperReturn {
  const supabaseAuth = useSupabaseAuth();
  
  // getToken関数をメモ化
  const getToken = useCallback(async (options?: { template?: string }) => {
    if (!supabaseAuth.session?.access_token) {
      throw new Error("No access token available");
    }
    return supabaseAuth.session.access_token;
  }, [supabaseAuth.session?.access_token]);
  
  return {
    userId: supabaseAuth.user?.id || null,
    isLoaded: !supabaseAuth.loading,
    isSignedIn: supabaseAuth.isAuthenticated,
    getToken,
    signOut: supabaseAuth.signOut,
    user: supabaseAuth.user,
    session: supabaseAuth.session,
  };
}
