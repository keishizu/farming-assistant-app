import React from 'react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { AuthForm } from '@/components/auth/AuthForm';
import { SupabaseAuthButtons } from '@/components/auth/SupabaseAuthButtons';
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
  usePathname: () => '/'
}));

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
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

describe('認証統合テスト', () => {
  let mockClient: any;

  // 現実的なモックデータ
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    aud: 'authenticated',
    role: 'authenticated'
  };

  const mockSession = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: mockUser
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // モックされたクライアントを取得
    const { getSupabaseClient } = require('@/lib/supabase');
    mockClient = getSupabaseClient();
    
    // デフォルトのモック設定
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

  describe('認証フロー全体のテスト', () => {
    it('未認証状態からログインまでの完全なフロー', async () => {
      const user = userEvent.setup();
      
      // ログイン成功のモック
      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession
        },
        error: null
      });

      // 認証状態変更のモック
      mockClient.auth.onAuthStateChange.mockImplementation((callback: any) => {
        // 認証成功後の状態変更をシミュレート
        setTimeout(() => {
          callback('SIGNED_IN', {
            user: mockUser,
            session: mockSession
          });
        }, 100);
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      render(
        <TestWrapper>
          <AuthForm />
        </TestWrapper>
      );

      // ログインフォームの表示確認
      expect(screen.getByRole('tab', { name: 'ログイン' })).toBeTruthy();
      expect(screen.getByLabelText('メールアドレス')).toBeTruthy();
      expect(screen.getByLabelText('パスワード')).toBeTruthy();

      // ログイン情報を入力
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      // フォーム送信イベントを発火
      const form = submitButton.closest('form');
      if (form) {
        fireEvent.submit(form);
      } else {
        await user.click(submitButton);
      }

      // ログインAPIが呼ばれることを確認
      await waitFor(() => {
        expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });

    it('新規登録からログインまでの完全なフロー', async () => {
      const user = userEvent.setup();
      
      // 新規登録成功のモック
      mockClient.auth.signUp.mockResolvedValue({
        data: {
          user: mockUser,
          session: null // 新規登録時はメール確認が必要なためセッションはnull
        },
        error: null
      });

      await act(async () => {
        render(
          <TestWrapper>
            <AuthForm />
          </TestWrapper>
        );
      });

      // 新規登録タブに切り替え（Radix UIの非同期レンダリングに対応）
      await waitFor(() => {
        const signupTab = screen.getByRole('tab', { name: '新規登録' });
        expect(signupTab).toBeTruthy();
      });

      const signupTab = screen.getByRole('tab', { name: '新規登録' });
      await act(async () => {
        await user.click(signupTab);
      });

      // 新規登録フォームの表示確認（Radix UIの非同期レンダリングを待機）
      await waitFor(() => {
        expect(screen.getByLabelText('パスワード確認')).toBeTruthy();
      }, { timeout: 10000 });

      // 新規登録情報を入力
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const confirmPasswordInput = screen.getByLabelText('パスワード確認');
      const submitButton = screen.getByRole('button', { name: '新規登録' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      
      // フォーム送信イベントを発火（より確実な方法）
      await act(async () => {
        const form = submitButton.closest('form');
        if (form) {
          fireEvent.submit(form);
        } else {
          await user.click(submitButton);
        }
      });

      // 新規登録APIが呼ばれることを確認
      await waitFor(() => {
        expect(mockClient.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      }, { timeout: 10000 });
    });

    it('Googleログインの完全なフロー', async () => {
      const user = userEvent.setup();
      
      // Googleログイン成功のモック
      mockClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://google.com/oauth' },
        error: null
      });

      render(
        <TestWrapper>
          <AuthForm />
        </TestWrapper>
      );

      // Googleログインボタンをクリック
      const googleButton = screen.getByText('Googleでログイン');
      await user.click(googleButton);

      // GoogleログインAPIが呼ばれることを確認
      await waitFor(() => {
        expect(mockClient.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: {
            redirectTo: expect.stringContaining('/auth/callback')
          }
        });
      });
    });
  });

  describe('認証状態の管理テスト', () => {
    it('認証済み状態でのUI表示', async () => {
      // 認証済み状態のモック
      mockClient.auth.getSession.mockResolvedValue({
        data: {
          session: mockSession
        },
        error: null
      });

      render(
        <TestWrapper>
          <SupabaseAuthButtons />
        </TestWrapper>
      );

      // 認証済み状態の表示を待つ
      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeTruthy();
        expect(screen.getByText('サインアウト')).toBeTruthy();
      });
    });

    it('未認証状態でのUI表示', async () => {
      // 未認証状態のモック
      mockClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      render(
        <TestWrapper>
          <SupabaseAuthButtons />
        </TestWrapper>
      );

      // 未認証状態の表示を待つ
      await waitFor(() => {
        expect(screen.getByText('ログイン')).toBeTruthy();
        expect(screen.getByText('新規登録')).toBeTruthy();
      });
    });

    it('ローディング状態でのUI表示', async () => {
      // ローディング状態のモック（セッション取得を遅延）
      mockClient.auth.getSession.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(
        <TestWrapper>
          <SupabaseAuthButtons />
        </TestWrapper>
      );

      // ローディング表示を確認
      expect(screen.getByText('読み込み中...')).toBeTruthy();
    });
  });

  describe('エラーハンドリングの統合テスト', () => {
    it('ログインエラー時の適切な処理', async () => {
      const user = userEvent.setup();
      
      // ログインエラーのモック
      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      });

      await act(async () => {
        render(
          <TestWrapper>
            <AuthForm />
          </TestWrapper>
        );
      });

      // フォーム要素の表示を待つ
      await waitFor(() => {
        expect(screen.getByLabelText('メールアドレス')).toBeTruthy();
        expect(screen.getByLabelText('パスワード')).toBeTruthy();
      });

      // ログイン情報を入力
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      
      // フォーム送信イベントを発火（より確実な方法）
      await act(async () => {
        const form = submitButton.closest('form');
        if (form) {
          fireEvent.submit(form);
        } else {
          await user.click(submitButton);
        }
      });

      // エラーメッセージの表示を確認（タイミング調整）
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeTruthy();
      }, { timeout: 5000 });
    });

    it('ネットワークエラー時の適切な処理', async () => {
      const user = userEvent.setup();
      
      // ネットワークエラーのモック
      mockClient.auth.signInWithPassword.mockRejectedValue(
        new Error('Network error')
      );

      await act(async () => {
        render(
          <TestWrapper>
            <AuthForm />
          </TestWrapper>
        );
      });

      // フォーム要素の表示を待つ
      await waitFor(() => {
        expect(screen.getByLabelText('メールアドレス')).toBeTruthy();
        expect(screen.getByLabelText('パスワード')).toBeTruthy();
      });

      // ログイン情報を入力
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      // フォーム送信イベントを発火（より確実な方法）
      await act(async () => {
        const form = submitButton.closest('form');
        if (form) {
          fireEvent.submit(form);
        } else {
          await user.click(submitButton);
        }
      });

      // エラーメッセージの表示を確認（タイミング調整）
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeTruthy();
      }, { timeout: 5000 });
    });
  });

  describe('セッション管理のテスト', () => {
    it('セッションの自動更新', async () => {
      // 初期セッション
      mockClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: '1', email: 'test@example.com' },
            access_token: 'token1',
            expires_at: Date.now() / 1000 + 3600 // 1時間後
          }
        },
        error: null
      });

      // セッション更新のモック
      let authStateCallback: any;
      mockClient.auth.onAuthStateChange.mockImplementation((callback: any) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      render(
        <TestWrapper>
          <SupabaseAuthButtons />
        </TestWrapper>
      );

      // 初期状態の確認
      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeTruthy();
      });

      // セッション更新をシミュレート
      if (authStateCallback) {
        authStateCallback('TOKEN_REFRESHED', {
          user: { id: '1', email: 'test@example.com' },
          session: {
            access_token: 'token2',
            expires_at: Date.now() / 1000 + 7200 // 2時間後
          }
        });
      }

      // 更新後の状態が維持されることを確認
      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeTruthy();
      });
    });

    it('セッション期限切れ時の処理', async () => {
      // 期限切れセッションのモック
      mockClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      // セッション期限切れのモック
      let authStateCallback: any;
      mockClient.auth.onAuthStateChange.mockImplementation((callback: any) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      render(
        <TestWrapper>
          <SupabaseAuthButtons />
        </TestWrapper>
      );

      // セッション期限切れをシミュレート
      if (authStateCallback) {
        authStateCallback('SIGNED_OUT', null);
      }

      // 未認証状態に戻ることを確認
      await waitFor(() => {
        expect(screen.getByText('ログイン')).toBeTruthy();
        expect(screen.getByText('新規登録')).toBeTruthy();
      });
    });
  });

  describe('フォームバリデーションの統合テスト', () => {
    it('必須フィールドのバリデーション', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(
          <TestWrapper>
            <AuthForm />
          </TestWrapper>
        );
      });

      // フォーム要素の表示を待つ
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'ログイン' })).toBeTruthy();
      });

      // 空の状態で送信
      const submitButton = screen.getByRole('button', { name: 'ログイン' });
      
      // フォーム送信イベントを発火（より確実な方法）
      await act(async () => {
        const form = submitButton.closest('form');
        if (form) {
          fireEvent.submit(form);
        } else {
          await user.click(submitButton);
        }
      });

      // バリデーションエラーの表示を確認（タイミング調整）
      await waitFor(() => {
        expect(screen.getByText('メールアドレスとパスワードを入力してください。')).toBeTruthy();
      }, { timeout: 5000 });
    });

    it('パスワード確認のバリデーション', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(
          <TestWrapper>
            <AuthForm />
          </TestWrapper>
        );
      });

      // 新規登録タブに切り替え（Radix UIの非同期レンダリングに対応）
      await waitFor(() => {
        const signupTab = screen.getByRole('tab', { name: '新規登録' });
        expect(signupTab).toBeTruthy();
      });

      const signupTab = screen.getByRole('tab', { name: '新規登録' });
      await act(async () => {
        await user.click(signupTab);
      });

      // 新規登録フォームの表示確認（Radix UIの非同期レンダリングを待機）
      await waitFor(() => {
        expect(screen.getByLabelText('パスワード確認')).toBeTruthy();
      }, { timeout: 5000 });

      // 異なるパスワードを入力
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const confirmPasswordInput = screen.getByLabelText('パスワード確認');
      const submitButton = screen.getByRole('button', { name: '新規登録' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'different123');
      
      // フォーム送信イベントを発火（より確実な方法）
      await act(async () => {
        const form = submitButton.closest('form');
        if (form) {
          fireEvent.submit(form);
        } else {
          await user.click(submitButton);
        }
      });

      // バリデーションエラーの表示を確認（タイミング調整）
      await waitFor(() => {
        expect(screen.getByText('パスワードが一致しません。')).toBeTruthy();
      }, { timeout: 5000 });
    });
  });
});
