import React from 'react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthForm } from '@/components/auth/AuthForm';
import { SupabaseAuthButtons } from '@/components/auth/SupabaseAuthButtons';
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

describe('認証フローのテスト', () => {
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

  describe('AuthForm コンポーネント', () => {
    it('ログインフォームが正しく表示される', () => {
      render(<AuthForm />);
      
      expect(screen.getByRole('tab', { name: 'ログイン' })).toBeTruthy();
      expect(screen.getByRole('tab', { name: '新規登録' })).toBeTruthy();
      expect(screen.getByLabelText('メールアドレス')).toBeTruthy();
      expect(screen.getByLabelText('パスワード')).toBeTruthy();
    });

    it('新規登録フォームが正しく表示される', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);
      
      const signupTab = screen.getByRole('tab', { name: '新規登録' });
      await user.click(signupTab);
      
      // パスワード確認フィールドが表示されることを確認
      await waitFor(() => {
        expect(screen.getByLabelText('パスワード確認')).toBeTruthy();
      });
    });

    it('ログインが正常に実行される', async () => {
      mockSignIn.mockResolvedValue({ data: { user: { id: '1', email: 'test@example.com' } }, error: null });
      
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
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('新規登録が正常に実行される', async () => {
      mockSignUp.mockResolvedValue({ 
        data: { user: { id: '1', email: 'test@example.com' } }, 
        error: null,
        message: '確認メールを送信しました。'
      });
      
      render(<AuthForm />);
      
      // タブの切り替えをactでラップ
      await act(async () => {
        const signupTab = screen.getByRole('tab', { name: '新規登録' });
        fireEvent.click(signupTab);
      });
      
      // タブの切り替えを待つ
      await waitFor(() => {
        expect(screen.getByRole('tabpanel')).toBeTruthy();
      });
      
      // パスワード確認フィールドの表示を待つ（実際のIDを使用）
      await waitFor(() => {
        expect(screen.getByLabelText('パスワード確認')).toBeTruthy();
      });
      
      // フォーム要素を取得して操作
      await act(async () => {
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
      });
      
      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('パスワード確認が一致しない場合エラーが表示される', async () => {
      render(<AuthForm />);
      
      // タブの切り替えをactでラップ
      await act(async () => {
        const signupTab = screen.getByRole('tab', { name: '新規登録' });
        fireEvent.click(signupTab);
      });
      
      // タブの切り替えを待つ
      await waitFor(() => {
        expect(screen.getByRole('tabpanel')).toBeTruthy();
      });
      
      // パスワード確認フィールドの表示を待つ（実際のIDを使用）
      await waitFor(() => {
        expect(screen.getByLabelText('パスワード確認')).toBeTruthy();
      });
      
      // フォーム要素を取得して操作
      await act(async () => {
        const emailInput = screen.getByLabelText('メールアドレス');
        const passwordInput = screen.getByLabelText('パスワード');
        const confirmPasswordInput = screen.getByLabelText('パスワード確認');
        const submitButton = screen.getByRole('button', { name: '新規登録' });
        
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('パスワードが一致しません。')).toBeTruthy();
      });
    });

    it('パスワードが短すぎる場合エラーが表示される', async () => {
      render(<AuthForm />);
      
      // タブの切り替えをactでラップ
      await act(async () => {
        const signupTab = screen.getByRole('tab', { name: '新規登録' });
        fireEvent.click(signupTab);
      });
      
      // タブの切り替えを待つ
      await waitFor(() => {
        expect(screen.getByRole('tabpanel')).toBeTruthy();
      });
      
      // パスワード確認フィールドの表示を待つ（実際のIDを使用）
      await waitFor(() => {
        expect(screen.getByLabelText('パスワード確認')).toBeTruthy();
      });
      
      // フォーム要素を取得して操作
      await act(async () => {
        const emailInput = screen.getByLabelText('メールアドレス');
        const passwordInput = screen.getByLabelText('パスワード');
        const confirmPasswordInput = screen.getByLabelText('パスワード確認');
        const submitButton = screen.getByRole('button', { name: '新規登録' });
        
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: '123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
        
        // フォーム送信イベントを発火
        const form = submitButton.closest('form');
        if (form) {
          fireEvent.submit(form);
        } else {
          fireEvent.click(submitButton);
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('パスワードは6文字以上で入力してください。')).toBeTruthy();
      });
    });

    it('Googleログインボタンが正常に動作する', async () => {
      mockSignInWithGoogle.mockResolvedValue({ data: { user: { id: '1', email: 'test@example.com' } }, error: null });
      
      render(<AuthForm />);
      
      const googleButton = screen.getByText('Googleでログイン');
      fireEvent.click(googleButton);
      
      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
      });
    });
  });

  describe('SupabaseAuthButtons コンポーネント', () => {
    it('未認証時にログイン・新規登録ボタンが表示される', () => {
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

      render(<SupabaseAuthButtons />);
      
      expect(screen.getByText('ログイン')).toBeTruthy();
      expect(screen.getByText('新規登録')).toBeTruthy();
    });

    it('認証済み時にユーザー情報とサインアウトボタンが表示される', () => {
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
    });

    it('ローディング中にローディング表示が表示される', () => {
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

    it('サインアウトが正常に実行される', async () => {
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

      mockSignOut.mockResolvedValue({ error: null });

      render(<SupabaseAuthButtons />);
      
      const signOutButton = screen.getByText('サインアウト');
      fireEvent.click(signOutButton);
      
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('ログインエラーが正しく表示される', async () => {
      const errorMessage = 'Invalid credentials';
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
      
      // フォーム送信イベントを発火
      const form = submitButton.closest('form');
      if (form) {
        fireEvent.submit(form);
      } else {
        fireEvent.click(submitButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeTruthy();
      });
    });

    it('新規登録エラーが正しく表示される', async () => {
      const errorMessage = 'User already registered';
      mockSignUp.mockResolvedValue({ 
        data: null, 
        error: { message: errorMessage } as any 
      });
      
      render(<AuthForm />);
      
      // タブの切り替えをactでラップ
      await act(async () => {
        const signupTab = screen.getByRole('tab', { name: '新規登録' });
        fireEvent.click(signupTab);
      });
      
      // タブの切り替えを待つ
      await waitFor(() => {
        expect(screen.getByRole('tabpanel')).toBeTruthy();
      });
      
      // パスワード確認フィールドの表示を待つ（実際のIDを使用）
      await waitFor(() => {
        expect(screen.getByLabelText('パスワード確認')).toBeTruthy();
      });
      
      // フォーム要素を取得して操作
      await act(async () => {
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
      });
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeTruthy();
      });
    });
  });
});
