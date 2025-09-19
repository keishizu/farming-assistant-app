"use client";

import { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { AuthContextType } from '@/lib/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading) {
      // 認証されていない場合はサインインページにリダイレクト
      if (!auth.isAuthenticated && !auth.loading) {
        const currentPath = window.location.pathname;
        // パブリックルートの場合はリダイレクトしない
        const publicRoutes = ['/', '/sign-in', '/sign-up', '/auth/callback'];
        const isPublicRoute = publicRoutes.includes(currentPath) || currentPath.startsWith('/auth/');
        
        if (!isPublicRoute) {
          console.log('User not authenticated, redirecting to sign-in');
          router.push('/sign-in');
        }
      }
    }
  }, [auth.isAuthenticated, auth.loading, router]);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
