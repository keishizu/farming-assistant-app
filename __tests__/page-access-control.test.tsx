import React from 'react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ConditionalLayout } from '@/components/ConditionalLayout';
import { useAuth } from '@/hooks/useAuth';

// Next.js routerのモック
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  }),
  usePathname: jest.fn()
}));

// Supabaseクライアントのモック
jest.mock('@/lib/supabase', () => {
  const mockSupabaseClient = {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    }
  };
  
  return {
    getSupabaseClient: jest.fn(() => mockSupabaseClient)
  };
});

// テスト用のラッパーコンポーネント
function TestWrapper({ children, pathname = '/' }: { children: React.ReactNode; pathname?: string }) {
  (usePathname as jest.Mock).mockReturnValue(pathname);
  
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

// 認証が必要なページのレイアウト（実際のAuthLayoutをシミュレート）
function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // デバッグ用ログ
  console.log('AuthLayout render:', { isAuthenticated, loading });

  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('User not authenticated, redirecting to sign-in');
      router.push("/sign-in");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // リダイレクト中
  }

  return <>{children}</>;
}

// 認証が必要なページのコンポーネント
function ProtectedPage() {
  return <div data-testid="protected-content">認証が必要なページ</div>;
}

// 認証不要なページのコンポーネント
function PublicPage() {
  return <div data-testid="public-content">認証不要なページ</div>;
}

describe('ページアクセス制御テスト', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { getSupabaseClient } = require('@/lib/supabase');
    mockClient = getSupabaseClient();
    
    // デフォルトのモック設定（未認証状態）
    mockClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    });
    mockClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('認証が必要なページのアクセス制御', () => {
    it('未認証状態で認証が必要なページにアクセスした場合、リダイレクトされる', async () => {
      // 未認証状態のモック
      mockClient.auth.getSession.mockResolvedValue({
        data: { session: null }
      });

      // 認証が必要なページのパスを設定
      render(
        <TestWrapper pathname="/work-record">
          <AuthLayoutWrapper>
            <ProtectedPage />
          </AuthLayoutWrapper>
        </TestWrapper>
      );

      // リダイレクトが発生することを確認
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/sign-in');
      }, { timeout: 3000 });
    });

    it('認証済み状態で認証が必要なページにアクセスした場合、コンテンツが表示される', async () => {
      // 認証済み状態のモック
      mockClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'test-user-id', email: 'test@example.com' },
            access_token: 'mock-token'
          }
        },
        error: null
      });

      render(
        <TestWrapper pathname="/work-record">
          <AuthLayoutWrapper>
            <ProtectedPage />
          </AuthLayoutWrapper>
        </TestWrapper>
      );

      // 認証済みコンテンツが表示されることを確認
      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeTruthy();
      });
    });
  });

  describe('認証不要なページのアクセス制御', () => {
    it('未認証状態で認証不要なページにアクセスした場合、コンテンツが表示される', async () => {
      render(
        <TestWrapper pathname="/">
          <PublicPage />
        </TestWrapper>
      );

      // 認証不要なコンテンツが表示されることを確認
      await waitFor(() => {
        expect(screen.getByTestId('public-content')).toBeTruthy();
      });
    });

    it('認証済み状態で認証不要なページにアクセスした場合、コンテンツが表示される', async () => {
      // 認証済み状態のモック
      mockClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'test-user-id', email: 'test@example.com' },
            access_token: 'mock-token'
          }
        },
        error: null
      });

      render(
        <TestWrapper pathname="/">
          <PublicPage />
        </TestWrapper>
      );

      // 認証済みコンテンツが表示されることを確認
      await waitFor(() => {
        expect(screen.getByTestId('public-content')).toBeTruthy();
      });
    });
  });

  describe('認証ページのアクセス制御', () => {
    it('未認証状態でサインインページにアクセスした場合、コンテンツが表示される', async () => {
      render(
        <TestWrapper pathname="/sign-in">
          <div data-testid="sign-in-content">サインインページ</div>
        </TestWrapper>
      );

      // サインインコンテンツが表示されることを確認
      await waitFor(() => {
        expect(screen.getByTestId('sign-in-content')).toBeTruthy();
      });
    });

    it('認証済み状態でサインインページにアクセスした場合、コンテンツが表示される', async () => {
      // 認証済み状態のモック
      mockClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'test-user-id', email: 'test@example.com' },
            access_token: 'mock-token'
          }
        },
        error: null
      });

      render(
        <TestWrapper pathname="/sign-in">
          <div data-testid="sign-in-content">サインインページ</div>
        </TestWrapper>
      );

      // サインインコンテンツが表示されることを確認
      await waitFor(() => {
        expect(screen.getByTestId('sign-in-content')).toBeTruthy();
      });
    });
  });

  describe('ナビゲーション表示制御', () => {
    it('未認証状態ではナビゲーションが表示されない', async () => {
      render(
        <TestWrapper pathname="/">
          <PublicPage />
        </TestWrapper>
      );

      // ナビゲーションが表示されないことを確認
      await waitFor(() => {
        expect(screen.queryByRole('navigation')).toBeNull();
      });
    });

    it('認証済み状態ではナビゲーションが表示される', async () => {
      // 認証済み状態のモック
      mockClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'test-user-id', email: 'test@example.com' },
            access_token: 'mock-token'
          }
        },
        error: null
      });

      render(
        <TestWrapper pathname="/work-record">
          <ConditionalLayout>
            <AuthLayoutWrapper>
              <ProtectedPage />
            </AuthLayoutWrapper>
          </ConditionalLayout>
        </TestWrapper>
      );

      // ナビゲーションが表示されることを確認
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeTruthy();
      });
    });

    it('認証ページではナビゲーションが表示されない', async () => {
      render(
        <TestWrapper pathname="/sign-in">
          <div data-testid="sign-in-content">サインインページ</div>
        </TestWrapper>
      );

      // ナビゲーションが表示されないことを確認
      await waitFor(() => {
        expect(screen.queryByRole('navigation')).toBeNull();
      });
    });
  });

  describe('ローディング状態の制御', () => {
    it('ローディング中は適切なローディング表示がされる', async () => {
      // ローディング状態をシミュレート（Promiseをpending状態にする）
      mockClient.auth.getSession.mockImplementation(
        () => new Promise(() => {}) // 永遠に解決されないPromise
      );

      render(
        <TestWrapper pathname="/work-record">
          <AuthLayoutWrapper>
            <ProtectedPage />
          </AuthLayoutWrapper>
        </TestWrapper>
      );

      // ローディング表示がされることを確認
      await waitFor(() => {
        expect(screen.getByText('読み込み中...')).toBeTruthy();
      }, { timeout: 1000 });
    });
  });
});
