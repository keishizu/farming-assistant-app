"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
  error: any;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, session, loading, error } = useAuth();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!loading) {
      const authenticated = !!user && !!session;
      setIsAuthenticated(authenticated);
      
      // 認証されていない場合はサインインページにリダイレクト
      if (!authenticated && !loading) {
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
  }, [user, session, loading, router]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      error,
      isAuthenticated
    }}>
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
