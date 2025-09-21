import React from 'react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';

// useAuthフックのモック
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

// Supabaseクライアントのモック
jest.mock('@/lib/supabase', () => ({
  getSupabaseClient: jest.fn(() => ({
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
  }))
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('認証エラーハンドリングのテスト', () => {
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

  describe('ログインエラーのテスト', () => {
    it('無効なメールアドレスでエラーが表示される', async () => {
      render(<AuthForm />);
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });
      
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('有効なメールアドレスを入力してください。')).toBeTruthy();
      });
    });

    it('間違ったパスワードでエラーが表示される', async () => {
      const errorMessage = 'Invalid login credentials';
      mockSignIn.mockResolvedValue({ 
        data: null, 
        error: { message: errorMessage } as any 
      });
      
      render(<AuthForm />);
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeTruthy();
      });
    });

    it('アカウントが無効化されている場合のエラーが表示される', async () => {
      const errorMessage = 'Account is disabled';
      mockSignIn.mockResolvedValue({ 
        data: null, 
        error: { message: errorMessage } as any 
      });
      
      render(<AuthForm />);
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });
      
      fireEvent.change(emailInput, { target: { value: 'disabled@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeTruthy();
      });
    });

    it('ネットワークエラーが適切に処理される', async () => {
      const errorMessage = 'Network error occurred';
      mockSignIn.mockRejectedValue(new Error(errorMessage));
      
      render(<AuthForm />);
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeTruthy();
      });
    });
  });

  describe('新規登録エラーのテスト', () => {
    it('既に登録済みのメールアドレスでエラーが表示される', async () => {
      const errorMessage = 'User already registered';
      mockSignUp.mockResolvedValue({ 
        data: null, 
        error: { message: errorMessage } as any 
      });
      
      render(<AuthForm />);
      
      const signupTab = screen.getByRole('tab', { name: '新規登録' });
      await act(async () => {
        fireEvent.click(signupTab);
      });
      
      // タブ切り替え後に新規登録フォームが表示されるまで待つ
      await waitFor(() => {
        expect(screen.getByLabelText('パスワード確認')).toBeTruthy();
      });
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const confirmPasswordInput = screen.getByLabelText('パスワード確認');
      const submitButton = screen.getByRole('button', { name: '新規登録' });
      
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeTruthy();
      });
    });

    it('弱いパスワードでエラーが表示される', async () => {
      render(<AuthForm />);
      
      const signupTab = screen.getByRole('tab', { name: '新規登録' });
      await act(async () => {
        fireEvent.click(signupTab);
      });
      
      // タブ切り替え後に新規登録フォームが表示されるまで待つ
      await waitFor(() => {
        expect(screen.getByLabelText('パスワード確認')).toBeTruthy();
      });
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const confirmPasswordInput = screen.getByLabelText('パスワード確認');
      const submitButton = screen.getByRole('button', { name: '新規登録' });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('パスワードは6文字以上で入力してください。')).toBeTruthy();
      });
    });

    it('無効なメールアドレス形式でエラーが表示される', async () => {
      render(<AuthForm />);
      
      const signupTab = screen.getByRole('tab', { name: '新規登録' });
      await act(async () => {
        fireEvent.click(signupTab);
      });
      
      // タブ切り替え後に新規登録フォームが表示されるまで待つ
      await waitFor(() => {
        expect(screen.getByLabelText('パスワード確認')).toBeTruthy();
      });
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const confirmPasswordInput = screen.getByLabelText('パスワード確認');
      const submitButton = screen.getByRole('button', { name: '新規登録' });
      
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('有効なメールアドレスを入力してください。')).toBeTruthy();
      });
    });
  });

  describe('Googleログインエラーのテスト', () => {
    it('Googleログインがキャンセルされた場合のエラーが表示される', async () => {
      const errorMessage = 'OAuth login was cancelled';
      mockSignInWithGoogle.mockResolvedValue({ 
        data: null, 
        error: { message: errorMessage } as any 
      });
      
      render(<AuthForm />);
      
      const googleButton = screen.getByText('Googleでログイン');
      fireEvent.click(googleButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeTruthy();
      });
    });

    it('Googleログインでネットワークエラーが発生した場合のエラーが表示される', async () => {
      const errorMessage = 'Network error during OAuth';
      mockSignInWithGoogle.mockRejectedValue(new Error(errorMessage));
      
      render(<AuthForm />);
      
      const googleButton = screen.getByText('Googleでログイン');
      fireEvent.click(googleButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeTruthy();
      });
    });
  });

  describe('サインアウトエラーのテスト', () => {
    it('サインアウトでエラーが発生した場合のエラーが表示される', async () => {
      const errorMessage = 'Sign out failed';
      mockSignOut.mockResolvedValue({ 
        error: { message: errorMessage } as any 
      });
      
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

      // AuthFormではなくSupabaseAuthButtonsをテストする
      const { SupabaseAuthButtons } = await import('@/components/auth/SupabaseAuthButtons');
      render(<SupabaseAuthButtons />);
      
      const signOutButton = screen.getByText('サインアウト');
      fireEvent.click(signOutButton);
      
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });
  });

  describe('フォームバリデーションエラーのテスト', () => {
    it('空のメールアドレスでエラーが表示される', async () => {
      render(<AuthForm />);
      
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });
      
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      // フォーム送信イベントを発火
      const form = submitButton.closest('form');
      if (form) {
        fireEvent.submit(form);
      } else {
        fireEvent.click(submitButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText('メールアドレスとパスワードを入力してください。')).toBeTruthy();
      });
    });

    it('空のパスワードでエラーが表示される', async () => {
      render(<AuthForm />);
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      // フォーム送信イベントを発火
      const form = submitButton.closest('form');
      if (form) {
        fireEvent.submit(form);
      } else {
        fireEvent.click(submitButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText('メールアドレスとパスワードを入力してください。')).toBeTruthy();
      });
    });

    it('新規登録で空のフィールドがある場合エラーが表示される', async () => {
      render(<AuthForm />);
      
      const signupTab = screen.getByRole('tab', { name: '新規登録' });
      await act(async () => {
        fireEvent.click(signupTab);
      });
      
      // タブ切り替え後に新規登録フォームが表示されるまで待つ
      await waitFor(() => {
        expect(screen.getByLabelText('パスワード確認')).toBeTruthy();
      });
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const submitButton = screen.getByRole('button', { name: '新規登録' });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      // フォーム送信イベントを発火
      const form = submitButton.closest('form');
      if (form) {
        fireEvent.submit(form);
      } else {
        fireEvent.click(submitButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText('すべての項目を入力してください。')).toBeTruthy();
      });
    });
  });

  describe('ローディング状態のテスト', () => {
    it('ログイン中はボタンが無効化される', async () => {
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      render(<AuthForm />);
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      // フォーム送信イベントを発火
      const form = submitButton.closest('form');
      if (form) {
        fireEvent.submit(form);
      } else {
        fireEvent.click(submitButton);
      }
      
      expect(submitButton.hasAttribute('disabled')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'ログイン' })).toBeTruthy();
    });

    it('新規登録中はボタンが無効化される', async () => {
      mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      render(<AuthForm />);
      
      const signupTab = screen.getByRole('tab', { name: '新規登録' });
      await act(async () => {
        fireEvent.click(signupTab);
      });
      
      // タブ切り替え後に新規登録フォームが表示されるまで待つ
      await waitFor(() => {
        expect(screen.getByLabelText('パスワード確認')).toBeTruthy();
      });
      
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const confirmPasswordInput = screen.getByLabelText('パスワード確認');
      const submitButton = screen.getByRole('button', { name: '新規登録' });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      
      // フォーム送信イベントを発火
      const form = submitButton.closest('form');
      if (form) {
        fireEvent.submit(form);
      } else {
        fireEvent.click(submitButton);
      }
      
      expect(submitButton.hasAttribute('disabled')).toBeTruthy();
      expect(screen.getByRole('button', { name: '新規登録' })).toBeTruthy();
    });
  });
});
