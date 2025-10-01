import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/comments/route';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Supabaseクライアントのモック
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

// Next.js cookiesのモック
jest.mock('next/headers', () => ({
  cookies: jest.fn()
}));

// 環境変数のモック
const originalEnv = process.env;

describe('API認証テスト', () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
  const mockCookies = cookies as jest.MockedFunction<typeof cookies>;
  const mockSupabaseClient = {
    auth: {
      getUser: jest.fn() as jest.MockedFunction<any>
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
    };
    mockCreateClient.mockReturnValue(mockSupabaseClient as any);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('POST /api/comments の認証テスト', () => {
    it('認証済みユーザーはコメントを投稿できる', async () => {
      // 有効なユーザーのモック
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: '1', email: 'test@example.com' } },
        error: null
      });

      // 有効なセッションCookieのモック
      (mockCookies as any).mockResolvedValue({
        get: jest.fn().mockReturnValue({
          name: 'sb-access-token',
          value: 'valid-token'
        })
      });

      const request = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nickname: 'テストユーザー',
          content: 'テストコメント'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        nickname: 'テストユーザー',
        content: 'テストコメント',
        userId: '1'
      });
    });

    it('未認証ユーザーはコメントを投稿できない', async () => {
      // 無効なユーザーのモック
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      // 無効なセッションCookieのモック
      (mockCookies as any).mockResolvedValue({
        get: jest.fn().mockReturnValue(null)
      });

      const request = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nickname: 'テストユーザー',
          content: 'テストコメント'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('認証が必要です');
    });

    it('セッションCookieがない場合は認証エラー', async () => {
      // セッションCookieがない場合のモック
      (mockCookies as any).mockResolvedValue({
        get: jest.fn().mockReturnValue(null)
      });

      const request = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nickname: 'テストユーザー',
          content: 'テストコメント'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('認証が必要です');
    });

    it('無効なトークンの場合は認証エラー', async () => {
      // 無効なトークンのモック
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      // 無効なセッションCookieのモック
      (mockCookies as any).mockResolvedValue({
        get: jest.fn().mockReturnValue({
          name: 'sb-access-token',
          value: 'invalid-token'
        })
      });

      const request = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nickname: 'テストユーザー',
          content: 'テストコメント'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('認証が必要です');
    });

    it('Supabase認証エラーが発生した場合は認証エラー', async () => {
      // 認証エラーのモック
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error('Supabase connection error')
      );

      // 有効なセッションCookieのモック
      (mockCookies as any).mockResolvedValue({
        get: jest.fn().mockReturnValue({
          name: 'sb-access-token',
          value: 'valid-token'
        })
      });

      const request = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nickname: 'テストユーザー',
          content: 'テストコメント'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('認証が必要です');
    });
  });

  describe('GET /api/comments の認証テスト', () => {
    it('認証なしでもコメントを取得できる', async () => {
      const request = new NextRequest('http://localhost:3000/api/comments');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe('バリデーションテスト', () => {
    beforeEach(() => {
      // 認証済みユーザーのモック
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: '1', email: 'test@example.com' } },
        error: null
      });

      (mockCookies as any).mockResolvedValue({
        get: jest.fn().mockReturnValue({
          name: 'sb-access-token',
          value: 'valid-token'
        })
      });
    });

    it('ニックネームが空の場合はバリデーションエラー', async () => {
      const request = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nickname: '',
          content: 'テストコメント'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('ニックネームとコメント内容は必須です');
    });

    it('コメント内容が空の場合はバリデーションエラー', async () => {
      const request = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nickname: 'テストユーザー',
          content: ''
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('ニックネームとコメント内容は必須です');
    });

    it('コメント内容が1000文字を超える場合はバリデーションエラー', async () => {
      const longContent = 'a'.repeat(1001);

      const request = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nickname: 'テストユーザー',
          content: longContent
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('コメントは1000文字以内で入力してください');
    });
  });

  describe('エラーハンドリングテスト', () => {
    it('JSONパースエラーが発生した場合はサーバーエラー', async () => {
      // 認証済みユーザーのモック
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: '1', email: 'test@example.com' } },
        error: null
      });

      (mockCookies as any).mockResolvedValue({
        get: jest.fn().mockReturnValue({
          name: 'sb-access-token',
          value: 'valid-token'
        })
      });

      const request = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid-json'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('サーバーエラーが発生しました');
    });

    it('予期しないエラーが発生した場合はサーバーエラー', async () => {
      // 認証済みユーザーのモック
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: '1', email: 'test@example.com' } },
        error: null
      });

      (mockCookies as any).mockResolvedValue({
        get: jest.fn().mockReturnValue({
          name: 'sb-access-token',
          value: 'valid-token'
        })
      });

      // 予期しないエラーをシミュレート
      jest.spyOn(JSON, 'stringify').mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nickname: 'テストユーザー',
          content: 'テストコメント'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('サーバーエラーが発生しました');

      // モックを復元
      jest.restoreAllMocks();
    });
  });

  // 認証システム移行完了により、認証フラグのテストは不要
});
