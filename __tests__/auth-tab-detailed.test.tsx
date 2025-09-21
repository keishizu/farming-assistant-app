import React from 'react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';

// useAuthフックのモック
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('認証タブ詳細テスト', () => {
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

  describe('Radix UIタブコンポーネントの動作テスト', () => {
    it('初期状態でログインタブがアクティブ', () => {
      render(<AuthForm />);
      
      // ログインタブがアクティブであることを確認
      const loginTab = screen.getByRole('tab', { name: 'ログイン' });
      expect(loginTab.getAttribute('data-state')).toBe('active');
      
      // 新規登録タブが非アクティブであることを確認
      const signupTab = screen.getByRole('tab', { name: '新規登録' });
      expect(signupTab.getAttribute('data-state')).toBe('inactive');
      
      // ログインフォームが表示されていることを確認
      expect(screen.getByLabelText('メールアドレス')).toBeTruthy();
      expect(screen.getByLabelText('パスワード')).toBeTruthy();
      expect(screen.queryByLabelText('パスワード確認')).toBeFalsy();
    });

    it('新規登録タブに切り替えが正常に動作', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);
      
      // 新規登録タブをクリック
      const signupTab = screen.getByRole('tab', { name: '新規登録' });
      
      await act(async () => {
        await user.click(signupTab);
      });
      
      // タブの状態が切り替わることを確認
      await waitFor(() => {
        expect(signupTab.getAttribute('data-state')).toBe('active');
      });
      
      const loginTab = screen.getByRole('tab', { name: 'ログイン' });
      expect(loginTab.getAttribute('data-state')).toBe('inactive');
      
      // 新規登録フォームが表示されることを確認
      await waitFor(() => {
        expect(screen.getByLabelText('パスワード確認')).toBeTruthy();
      });
    });

    it('タブ切り替え時にフォームの状態がリセットされる', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);
      
      // ログインフォームに値を入力
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      
      await act(async () => {
        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
      });
      
      expect(emailInput.getAttribute('value')).toBe('test@example.com');
      expect(passwordInput.getAttribute('value')).toBe('password123');
      
      // 新規登録タブに切り替え
      const signupTab = screen.getByRole('tab', { name: '新規登録' });
      
      await act(async () => {
        await user.click(signupTab);
      });
      
      // フォームの値がリセットされることを確認
      await waitFor(() => {
        const newEmailInput = screen.getByLabelText('メールアドレス');
        const newPasswordInput = screen.getByLabelText('パスワード');
        expect(newEmailInput.getAttribute('value')).toBe('');
        expect(newPasswordInput.getAttribute('value')).toBe('');
      });
    });

    it('タブ切り替え時にエラーメッセージがクリアされる', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);
      
      // ログインフォームでエラーを発生させる（空の状態で送信）
      const submitButton = screen.getByRole('button', { name: 'ログイン' });
      
      await act(async () => {
        await user.click(submitButton);
      });
      
      // エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('メールアドレスとパスワードを入力してください。')).toBeTruthy();
      });
      
      // 新規登録タブに切り替え
      const signupTab = screen.getByRole('tab', { name: '新規登録' });
      
      await act(async () => {
        await user.click(signupTab);
      });
      
      // エラーメッセージがクリアされることを確認
      await waitFor(() => {
        expect(screen.queryByText('メールアドレスとパスワードを入力してください。')).toBeFalsy();
      });
    });
  });

  describe('フォームバリデーションの詳細テスト', () => {
    it('ログインフォームの必須フィールドバリデーション', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);
      
      // フォームを取得して送信イベントを発火
      const form = screen.getByRole('form', { hidden: true }) || 
                   screen.getByRole('button', { name: 'ログイン' }).closest('form');
      
      if (form) {
        await act(async () => {
          fireEvent.submit(form);
        });
      } else {
        // フォームが見つからない場合はボタンクリック
        const submitButton = screen.getByRole('button', { name: 'ログイン' });
        await act(async () => {
          await user.click(submitButton);
        });
      }
      
      await waitFor(() => {
        expect(screen.getByText('メールアドレスとパスワードを入力してください。')).toBeTruthy();
      });
    });

    it('新規登録フォームの必須フィールドバリデーション', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);
      
      // 新規登録タブに切り替え
      const signupTab = screen.getByRole('tab', { name: '新規登録' });
      
      await act(async () => {
        await user.click(signupTab);
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('パスワード確認')).toBeTruthy();
      });
      
      // フォームを取得して送信イベントを発火
      const form = screen.getByRole('button', { name: '新規登録' }).closest('form');
      
      if (form) {
        await act(async () => {
          fireEvent.submit(form);
        });
      } else {
        // フォームが見つからない場合はボタンクリック
        const submitButton = screen.getByRole('button', { name: '新規登録' });
        await act(async () => {
          await user.click(submitButton);
        });
      }
      
      await waitFor(() => {
        expect(screen.getByText('すべての項目を入力してください。')).toBeTruthy();
      });
    });

    it('パスワード確認のバリデーション', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);
      
      // 新規登録タブに切り替え
      const signupTab = screen.getByRole('tab', { name: '新規登録' });
      
      await act(async () => {
        await user.click(signupTab);
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('パスワード確認')).toBeTruthy();
      });
      
      // フォームに値を入力
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const confirmPasswordInput = screen.getByLabelText('パスワード確認');
      
      await act(async () => {
        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.type(confirmPasswordInput, 'different123');
      });
      
      // 新規登録送信ボタンをクリック
      const submitButton = screen.getByRole('button', { name: '新規登録' });
      
      await act(async () => {
        await user.click(submitButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('パスワードが一致しません。')).toBeTruthy();
      });
    });

    it('パスワード長のバリデーション', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);
      
      // 新規登録タブに切り替え
      const signupTab = screen.getByRole('tab', { name: '新規登録' });
      
      await act(async () => {
        await user.click(signupTab);
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('パスワード確認')).toBeTruthy();
      });
      
      // フォームに値を入力（短いパスワード）
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const confirmPasswordInput = screen.getByLabelText('パスワード確認');
      
      await act(async () => {
        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, '123');
        await user.type(confirmPasswordInput, '123');
      });
      
      // 新規登録送信ボタンをクリック
      const submitButton = screen.getByRole('button', { name: '新規登録' });
      
      await act(async () => {
        await user.click(submitButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('パスワードは6文字以上で入力してください。')).toBeTruthy();
      });
    });
  });

  describe('エラーメッセージの表示ロジックテスト', () => {
    it('フォームエラーが優先的に表示される', async () => {
      const user = userEvent.setup();
      
      // useAuthのエラーを設定
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        loading: false,
        error: { message: 'Auth error' } as any,
        isAuthenticated: false,
        signIn: mockSignIn,
        signUp: mockSignUp,
        signOut: mockSignOut,
        signInWithGoogle: mockSignInWithGoogle,
        resetPassword: jest.fn() as jest.MockedFunction<(email: string) => Promise<{ data: any; error: any }>>,
        updateProfile: jest.fn() as jest.MockedFunction<(updates: any) => Promise<{ data: any; error: any }>>,
        getToken: jest.fn() as jest.MockedFunction<(options?: any) => Promise<string>>
      });
      
      render(<AuthForm />);
      
      // フォームエラーを発生させる（送信ボタンをクリック）
      const submitButton = screen.getByRole('button', { name: 'ログイン' });
      
      await act(async () => {
        await user.click(submitButton);
      });
      
      // フォームエラーが表示されることを確認（useAuthのエラーより優先）
      await waitFor(() => {
        expect(screen.getByText('メールアドレスとパスワードを入力してください。')).toBeTruthy();
        expect(screen.queryByText('Auth error')).toBeFalsy();
      });
    });

    it('useAuthのエラーが表示される', async () => {
      const user = userEvent.setup();
      
      // useAuthのエラーを設定
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        loading: false,
        error: { message: 'Auth error' } as any,
        isAuthenticated: false,
        signIn: mockSignIn,
        signUp: mockSignUp,
        signOut: mockSignOut,
        signInWithGoogle: mockSignInWithGoogle,
        resetPassword: jest.fn() as jest.MockedFunction<(email: string) => Promise<{ data: any; error: any }>>,
        updateProfile: jest.fn() as jest.MockedFunction<(updates: any) => Promise<{ data: any; error: any }>>,
        getToken: jest.fn() as jest.MockedFunction<(options?: any) => Promise<string>>
      });
      
      render(<AuthForm />);
      
      // フォームに値を入力して送信
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      
      await act(async () => {
        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
      });
      
      // 送信ボタンをクリック
      const submitButton = screen.getByRole('button', { name: 'ログイン' });
      
      await act(async () => {
        await user.click(submitButton);
      });
      
      // useAuthのエラーが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('Auth error')).toBeTruthy();
      });
    });
  });

  describe('パスワード表示切り替えのテスト', () => {
    it('パスワード表示切り替えボタンが正常に動作', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);
      
      const passwordInput = screen.getByLabelText('パスワード');
      const toggleButton = screen.getByRole('button', { name: '' }); // アイコンボタン
      
      // 初期状態ではパスワードが隠されている
      expect(passwordInput.getAttribute('type')).toBe('password');
      
      // パスワードを入力
      await act(async () => {
        await user.type(passwordInput, 'password123');
      });
      
      // 表示切り替えボタンをクリック
      await act(async () => {
        await user.click(toggleButton);
      });
      
      // パスワードが表示されることを確認
      expect(passwordInput.getAttribute('type')).toBe('text');
      
      // 再度クリックして隠す
      await act(async () => {
        await user.click(toggleButton);
      });
      
      // パスワードが隠されることを確認
      expect(passwordInput.getAttribute('type')).toBe('password');
    });

    it('新規登録フォームのパスワード確認表示切り替えが正常に動作', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);
      
      // 新規登録タブに切り替え
      const signupTab = screen.getByRole('tab', { name: '新規登録' });
      
      await act(async () => {
        await user.click(signupTab);
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('パスワード確認')).toBeTruthy();
      });
      
      const confirmPasswordInput = screen.getByLabelText('パスワード確認');
      const toggleButtons = screen.getAllByRole('button', { name: '' }); // アイコンボタン
      const confirmToggleButton = toggleButtons[1]; // 2番目のボタン（パスワード確認用）
      
      // 初期状態ではパスワード確認が隠されている
      expect(confirmPasswordInput.getAttribute('type')).toBe('password');
      
      // パスワード確認を入力
      await act(async () => {
        await user.type(confirmPasswordInput, 'password123');
      });
      
      // 表示切り替えボタンをクリック
      await act(async () => {
        await user.click(confirmToggleButton);
      });
      
      // パスワード確認が表示されることを確認
      expect(confirmPasswordInput.getAttribute('type')).toBe('text');
    });
  });
});
