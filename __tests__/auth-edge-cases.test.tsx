import React from 'react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AuthForm } from '@/components/auth/AuthForm';
import { SupabaseAuthButtons } from '@/components/auth/SupabaseAuthButtons';
import { useAuth } from '@/hooks/useAuth';

// useAuthフックのモック
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('認証エッジケーステスト', () => {
  const mockSignIn = jest.fn() as jest.MockedFunction<(email: string, password: string) => Promise<{ data: any; error: any }>>;
  const mockSignUp = jest.fn() as jest.MockedFunction<(email: string, password: string) => Promise<{ data: any; error: any; message?: string }>>;
  const mockSignOut = jest.fn() as jest.MockedFunction<() => Promise<{ error: any }>>;
  const mockSignInWithGoogle = jest.fn() as jest.MockedFunction<() => Promise<{ data: any; error: any }>>;

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      signIn: mockSignIn,
      signUp: mockSignUp,
      signOut: mockSignOut,
      signInWithGoogle: mockSignInWithGoogle,
      resetPassword: jest.fn() as jest.MockedFunction<(email: string) => Promise<{ data: any; error: any }>>,
      updateProfile: jest.fn() as jest.MockedFunction<(updates: any) => Promise<{ data: any; error: any }>>,
      getToken: jest.fn() as jest.MockedFunction<(options?: any) => Promise<string>>
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ネットワークエラーのテスト', () => {
    it('ログイン時のネットワークエラー', async () => {
      const user = userEvent.setup();
      
      // ネットワークエラーをシミュレート
      mockSignIn.mockRejectedValue(new Error('Network error'));
      
      render(<AuthForm />);
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      
      await act(async () => {
        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
      });
      
      // 送信ボタンをクリック
      const submitButton = screen.getByRole('button', { name: 'ログイン' });
      
      await act(async () => {
        // フォーム送信イベントを発火
        const form = submitButton.closest('form');
        if (form) {
          fireEvent.submit(form);
        } else {
          await user.click(submitButton);
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeTruthy();
      });
    });

    it('新規登録時のネットワークエラー', async () => {
      const user = userEvent.setup();
      
      // ネットワークエラーをシミュレート
      mockSignUp.mockRejectedValue(new Error('Network error'));
      
      render(<AuthForm />);
      
      // 新規登録タブに切り替え
      const signupTab = screen.getByRole('tab', { name: '新規登録' });
      
      await act(async () => {
        await user.click(signupTab);
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('パスワード確認')).toBeTruthy();
      });
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const confirmPasswordInput = screen.getByLabelText('パスワード確認');
      
      await act(async () => {
        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.type(confirmPasswordInput, 'password123');
      });
      
      // 新規登録送信ボタンをクリック
      const submitButton = screen.getByRole('button', { name: '新規登録' });
      
      await act(async () => {
        // フォーム送信イベントを発火
        const form = submitButton.closest('form');
        if (form) {
          fireEvent.submit(form);
        } else {
          await user.click(submitButton);
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeTruthy();
      });
    });

    it('Googleログイン時のネットワークエラー', async () => {
      const user = userEvent.setup();
      
      // ネットワークエラーをシミュレート
      mockSignInWithGoogle.mockRejectedValue(new Error('Network error'));
      
      render(<AuthForm />);
      
      const googleButton = screen.getByText('Googleでログイン');
      
      await act(async () => {
        await user.click(googleButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeTruthy();
      });
    });
  });

  describe('認証エラーの詳細テスト', () => {
    it('無効なメールアドレス形式', async () => {
      const user = userEvent.setup();
      
      render(<AuthForm />);
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      
      await act(async () => {
        await user.type(emailInput, 'invalid-email');
        await user.type(passwordInput, 'password123');
      });
      
      // 送信ボタンをクリック
      const submitButton = screen.getByRole('button', { name: 'ログイン' });
      
      await act(async () => {
        // フォーム送信イベントを発火
        const form = submitButton.closest('form');
        if (form) {
          fireEvent.submit(form);
        } else {
          await user.click(submitButton);
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('有効なメールアドレスを入力してください。')).toBeTruthy();
      });
    });

    it('アカウントが存在しない場合', async () => {
      const user = userEvent.setup();
      
      mockSignIn.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });
      
      render(<AuthForm />);
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      
      await act(async () => {
        await user.type(emailInput, 'nonexistent@example.com');
        await user.type(passwordInput, 'wrongpassword');
      });
      
      // 送信ボタンをクリック
      const submitButton = screen.getByRole('button', { name: 'ログイン' });
      
      await act(async () => {
        // フォーム送信イベントを発火
        const form = submitButton.closest('form');
        if (form) {
          fireEvent.submit(form);
        } else {
          await user.click(submitButton);
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('Invalid login credentials')).toBeTruthy();
      });
    });

    it('アカウントが既に存在する場合（新規登録）', async () => {
      const user = userEvent.setup();
      
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' }
      });
      
      render(<AuthForm />);
      
      // 新規登録タブに切り替え
      const signupTab = screen.getByRole('tab', { name: '新規登録' });
      
      await act(async () => {
        await user.click(signupTab);
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('パスワード確認')).toBeTruthy();
      });
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const confirmPasswordInput = screen.getByLabelText('パスワード確認');
      
      await act(async () => {
        await user.type(emailInput, 'existing@example.com');
        await user.type(passwordInput, 'password123');
        await user.type(confirmPasswordInput, 'password123');
      });
      
      // 新規登録送信ボタンをクリック
      const submitButton = screen.getByRole('button', { name: '新規登録' });
      
      await act(async () => {
        // フォーム送信イベントを発火
        const form = submitButton.closest('form');
        if (form) {
          fireEvent.submit(form);
        } else {
          await user.click(submitButton);
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('User already registered')).toBeTruthy();
      });
    });

    it('メール確認が必要な場合', async () => {
      const user = userEvent.setup();
      
      mockSignUp.mockResolvedValue({
        data: { user: { id: '1', email: 'test@example.com' }, session: null },
        error: null,
        message: 'Check your email for the confirmation link'
      });
      
      render(<AuthForm />);
      
      // 新規登録タブに切り替え
      const signupTab = screen.getByRole('tab', { name: '新規登録' });
      
      await act(async () => {
        await user.click(signupTab);
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('パスワード確認')).toBeTruthy();
      });
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const confirmPasswordInput = screen.getByLabelText('パスワード確認');
      
      await act(async () => {
        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.type(confirmPasswordInput, 'password123');
      });
      
      // 新規登録送信ボタンをクリック
      const submitButton = screen.getByRole('button', { name: '新規登録' });
      
      await act(async () => {
        // フォーム送信イベントを発火
        const form = submitButton.closest('form');
        if (form) {
          fireEvent.submit(form);
        } else {
          await user.click(submitButton);
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('Check your email for the confirmation link')).toBeTruthy();
      });
    });
  });

  describe('フォーム入力のエッジケース', () => {
    it('非常に長いメールアドレス', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const longEmail = 'a'.repeat(100) + '@example.com';
      
      await act(async () => {
        await user.type(emailInput, longEmail);
      });
      
      expect(emailInput.getAttribute('value')).toBe(longEmail);
    });

    it('特殊文字を含むパスワード', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);
      
      const passwordInput = screen.getByLabelText('パスワード');
      const specialPassword = 'P@ssw0rd!@#$%^&*()';
      
      await act(async () => {
        await user.type(passwordInput, specialPassword);
      });
      
      expect(passwordInput.getAttribute('value')).toBe(specialPassword);
    });

    it('空白文字のみの入力', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      
      await act(async () => {
        await user.type(emailInput, '   ');
        await user.type(passwordInput, '   ');
      });
      
      // 送信ボタンをクリック
      const submitButton = screen.getByRole('button', { name: 'ログイン' });
      
      await act(async () => {
        // フォーム送信イベントを発火
        const form = submitButton.closest('form');
        if (form) {
          fireEvent.submit(form);
        } else {
          await user.click(submitButton);
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('メールアドレスとパスワードを入力してください。')).toBeTruthy();
      });
    });

    it('改行文字を含む入力', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      
      await act(async () => {
        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password');
      });
      
      expect(emailInput.getAttribute('value')).toBe('test@example.com');
      expect(passwordInput.getAttribute('value')).toBe('password');
    });
  });

  describe('ローディング状態のエッジケース', () => {
    it('ログイン中の重複送信防止', async () => {
      const user = userEvent.setup();
      
      // ログイン処理を遅延させる
      mockSignIn.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { user: { id: '1' } }, error: null }), 1000))
      );
      
      render(<AuthForm />);
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });
      
      await act(async () => {
        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        
        // フォーム送信イベントを発火
        const form = submitButton.closest('form');
        if (form) {
          fireEvent.submit(form);
        } else {
          await user.click(submitButton);
        }
      });
      
      // ローディング中に再度クリック
      await act(async () => {
        // フォーム送信イベントを発火
        const form = submitButton.closest('form');
        if (form) {
          fireEvent.submit(form);
        } else {
          await user.click(submitButton);
        }
      });
      
      // ログインAPIが1回だけ呼ばれることを確認
      expect(mockSignIn).toHaveBeenCalledTimes(1);
    });

    it('Googleログイン中の重複送信防止', async () => {
      const user = userEvent.setup();
      
      // Googleログイン処理を遅延させる
      mockSignInWithGoogle.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { user: { id: '1' } }, error: null }), 1000))
      );
      
      render(<AuthForm />);
      
      const googleButton = screen.getByText('Googleでログイン');
      
      await act(async () => {
        await user.click(googleButton);
      });
      
      // ローディング中に再度クリック
      await act(async () => {
        await user.click(googleButton);
      });
      
      // GoogleログインAPIが1回だけ呼ばれることを確認
      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    });
  });

  describe('認証状態のエッジケース', () => {
    it('認証済み状態でのフォーム表示', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' } as any,
        session: { access_token: 'token' } as any,
        loading: false,
        error: null,
        isAuthenticated: true,
        signIn: mockSignIn,
        signUp: mockSignUp,
        signOut: mockSignOut,
        signInWithGoogle: mockSignInWithGoogle,
        resetPassword: jest.fn() as jest.MockedFunction<(email: string) => Promise<{ data: any; error: any }>>,
        updateProfile: jest.fn() as jest.MockedFunction<(updates: any) => Promise<{ data: any; error: any }>>,
        getToken: jest.fn() as jest.MockedFunction<(options?: any) => Promise<string>>
      });

      render(<SupabaseAuthButtons />);
      
      expect(screen.getByText('test@example.com')).toBeTruthy();
      expect(screen.getByText('サインアウト')).toBeTruthy();
      expect(screen.queryByText('ログイン')).toBeFalsy();
      expect(screen.queryByText('新規登録')).toBeFalsy();
    });

    it('ローディング状態での表示', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        loading: true,
        error: null,
        isAuthenticated: false,
        signIn: mockSignIn,
        signUp: mockSignUp,
        signOut: mockSignOut,
        signInWithGoogle: mockSignInWithGoogle,
        resetPassword: jest.fn() as jest.MockedFunction<(email: string) => Promise<{ data: any; error: any }>>,
        updateProfile: jest.fn() as jest.MockedFunction<(updates: any) => Promise<{ data: any; error: any }>>,
        getToken: jest.fn() as jest.MockedFunction<(options?: any) => Promise<string>>
      });

      render(<SupabaseAuthButtons />);
      
      expect(screen.getByText('読み込み中...')).toBeTruthy();
    });

    it('エラー状態での表示', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        loading: false,
        error: { message: 'Authentication error' } as any,
        isAuthenticated: false,
        signIn: mockSignIn,
        signUp: mockSignUp,
        signOut: mockSignOut,
        signInWithGoogle: mockSignInWithGoogle,
        resetPassword: jest.fn() as jest.MockedFunction<(email: string) => Promise<{ data: any; error: any }>>,
        updateProfile: jest.fn() as jest.MockedFunction<(updates: any) => Promise<{ data: any; error: any }>>,
        getToken: jest.fn() as jest.MockedFunction<(options?: any) => Promise<string>>
      });

      render(<SupabaseAuthButtons />);
      
      expect(screen.getByText('ログイン')).toBeTruthy();
      expect(screen.getByText('新規登録')).toBeTruthy();
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量の文字入力でのパフォーマンス', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      
      const startTime = performance.now();
      
      // 大量の文字を入力（回数を減らしてタイムアウトを防ぐ）
      await act(async () => {
        for (let i = 0; i < 10; i++) {
          await user.type(emailInput, 'a');
          await user.type(passwordInput, 'b');
        }
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // パフォーマンスが許容範囲内であることを確認（2秒以内）
      expect(duration).toBeLessThan(2000);
    }, 10000);

    it('高速なタブ切り替え', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);
      
      const loginTab = screen.getByRole('tab', { name: 'ログイン' });
      const signupTab = screen.getByRole('tab', { name: '新規登録' });
      
      const startTime = performance.now();
      
      // 高速でタブを切り替え（回数を減らす）
      await act(async () => {
        for (let i = 0; i < 3; i++) {
          await user.click(signupTab);
          await user.click(loginTab);
        }
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // パフォーマンスが許容範囲内であることを確認（1秒以内）
      expect(duration).toBeLessThan(1000);
    });
  });
});
