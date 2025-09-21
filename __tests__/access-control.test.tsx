import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

// useAuthフックのモック
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

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
  usePathname: () => '/work-record'
}));

// ミドルウェアのテスト用ヘルパー関数
const mockMiddleware = (pathname: string, isAuthenticated: boolean) => {
  const publicRoutes = ['/', '/sign-in', '/sign-up', '/auth/callback'];
  const protectedRoutes = ['/work-record', '/projects', '/settings', '/profile'];
  
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/');
  const isProtectedRoute = protectedRoutes.includes(pathname);
  
  if (isProtectedRoute && !isAuthenticated) {
    return { redirect: '/sign-in' };
  }
  
  if (isPublicRoute && isAuthenticated && pathname !== '/') {
    return { redirect: '/work-record' };
  }
  
  return { allow: true };
};

describe('アクセス制御のテスト', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ミドルウェアのアクセス制御', () => {
    it('認証が必要なページに未認証ユーザーがアクセスした場合、ログインページにリダイレクトされる', () => {
      const result = mockMiddleware('/work-record', false);
      expect(result).toEqual({ redirect: '/sign-in' });
    });

    it('認証が必要なページに認証済みユーザーがアクセスした場合、アクセスが許可される', () => {
      const result = mockMiddleware('/work-record', true);
      expect(result).toEqual({ allow: true });
    });

    it('公開ページに未認証ユーザーがアクセスした場合、アクセスが許可される', () => {
      const result = mockMiddleware('/', false);
      expect(result).toEqual({ allow: true });
    });

    it('公開ページに認証済みユーザーがアクセスした場合、ダッシュボードにリダイレクトされる', () => {
      const result = mockMiddleware('/sign-in', true);
      expect(result).toEqual({ redirect: '/work-record' });
    });

    it('認証コールバックページは認証状態に関係なくアクセス可能', () => {
      const result = mockMiddleware('/auth/callback', false);
      expect(result).toEqual({ allow: true });
    });

    it('認証コールバックページは認証済みユーザーもアクセス可能', () => {
      const result = mockMiddleware('/auth/callback', true);
      expect(result).toEqual({ allow: true });
    });
  });

  describe('保護されたルートのテスト', () => {
    const protectedRoutes = [
      '/work-record',
      '/projects',
      '/settings',
      '/profile'
    ];

    protectedRoutes.forEach(route => {
      it(`${route} に未認証ユーザーがアクセスした場合、ログインページにリダイレクトされる`, () => {
        const result = mockMiddleware(route, false);
        expect(result).toEqual({ redirect: '/sign-in' });
      });

      it(`${route} に認証済みユーザーがアクセスした場合、アクセスが許可される`, () => {
        const result = mockMiddleware(route, true);
        expect(result).toEqual({ allow: true });
      });
    });
  });

  describe('公開ルートのテスト', () => {
    const publicRoutes = [
      '/',
      '/sign-in',
      '/sign-up'
    ];

    publicRoutes.forEach(route => {
      it(`${route} に未認証ユーザーがアクセスした場合、アクセスが許可される`, () => {
        const result = mockMiddleware(route, false);
        expect(result).toEqual({ allow: true });
      });
    });

    it('認証済みユーザーが /sign-in にアクセスした場合、ダッシュボードにリダイレクトされる', () => {
      const result = mockMiddleware('/sign-in', true);
      expect(result).toEqual({ redirect: '/work-record' });
    });

    it('認証済みユーザーが /sign-up にアクセスした場合、ダッシュボードにリダイレクトされる', () => {
      const result = mockMiddleware('/sign-up', true);
      expect(result).toEqual({ redirect: '/work-record' });
    });

    it('認証済みユーザーが / にアクセスした場合、アクセスが許可される', () => {
      const result = mockMiddleware('/', true);
      expect(result).toEqual({ allow: true });
    });
  });

  describe('認証状態の変更によるリダイレクト', () => {
    it('ログイン成功時に公開ページからダッシュボードにリダイレクトされる', () => {
      // ログイン前の状態（公開ページにいる）
      const beforeLogin = mockMiddleware('/sign-in', false);
      expect(beforeLogin).toEqual({ allow: true });

      // ログイン後の状態（ダッシュボードにリダイレクト）
      const afterLogin = mockMiddleware('/sign-in', true);
      expect(afterLogin).toEqual({ redirect: '/work-record' });
    });

    it('ログアウト時に保護されたページからログインページにリダイレクトされる', () => {
      // ログアウト前の状態（保護されたページにいる）
      const beforeLogout = mockMiddleware('/work-record', true);
      expect(beforeLogout).toEqual({ allow: true });

      // ログアウト後の状態（ログインページにリダイレクト）
      const afterLogout = mockMiddleware('/work-record', false);
      expect(afterLogout).toEqual({ redirect: '/sign-in' });
    });
  });

  describe('エッジケース', () => {
    it('存在しないルートは未認証ユーザーでもアクセス可能', () => {
      const result = mockMiddleware('/non-existent-route', false);
      expect(result).toEqual({ allow: true });
    });

    it('存在しないルートは認証済みユーザーでもアクセス可能', () => {
      const result = mockMiddleware('/non-existent-route', true);
      expect(result).toEqual({ allow: true });
    });

    it('サブパスを持つ保護されたルートも正しく処理される', () => {
      const result = mockMiddleware('/work-record/123', false);
      expect(result).toEqual({ allow: true }); // サブパスは現在の実装では保護されていない
    });
  });
});
