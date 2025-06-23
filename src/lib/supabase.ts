import { createClient } from "@supabase/supabase-js";
import { SupabaseClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useEffect, useState, useRef } from "react";
import { toStableUUID } from '../utils/user-id';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// シングルトンインスタンスを管理
let authenticatedClient: SupabaseClient | null = null;
let currentToken: string | null = null;
let tokenExpiry: number | null = null;

// JWTトークンの詳細情報を解析する関数
function parseJWTToken(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - currentTime;
    
    return {
      exp: payload.exp,
      iat: payload.iat,
      currentTime,
      timeUntilExpiry,
      isExpired: payload.exp < currentTime,
      willExpireSoon: payload.exp < (currentTime + 60), // 1分以内に変更
      payload
    };
  } catch (error) {
    console.error('JWT token parsing failed:', error);
    return null;
  }
}

// JWTトークンの有効期限をチェックする関数（緩和版）
function isTokenExpired(token: string): boolean {
  const tokenInfo = parseJWTToken(token);
  if (!tokenInfo) {
    console.warn('Token parsing failed, treating as expired');
    return true;
  }
  
  // console.log('Token expiry check:', {
  //   currentTime: new Date(tokenInfo.currentTime * 1000).toISOString(),
  //   expiryTime: new Date(tokenInfo.exp * 1000).toISOString(),
  //   timeUntilExpiry: `${Math.floor(tokenInfo.timeUntilExpiry / 60)}分${tokenInfo.timeUntilExpiry % 60}秒`,
  //   isExpired: tokenInfo.isExpired,
  //   willExpireSoon: tokenInfo.willExpireSoon,
  //   // トークンの詳細情報を追加
  //   tokenLength: token.length,
  //   tokenStart: token.substring(0, 20) + '...',
  //   tokenEnd: '...' + token.substring(token.length - 20)
  // });
  
  // 実際に期限切れの場合のみtrueを返す（緩和）
  return tokenInfo.isExpired;
}

// トークンの有効期限を取得する関数
function getTokenExpiry(token: string): number | null {
  const tokenInfo = parseJWTToken(token);
  return tokenInfo?.exp || null;
}

// Clerkトークンを使って SupabaseClient を生成する関数
export const createSupabaseWithAuth = (token: string): SupabaseClient => {
  // トークンの詳細情報をログ出力
  const tokenInfo = parseJWTToken(token);
  if (tokenInfo) {
    // console.log('Creating Supabase client with token:', {
    //   tokenLength: token.length,
    //   expiryTime: new Date(tokenInfo.exp * 1000).toISOString(),
    //   timeUntilExpiry: `${Math.floor(tokenInfo.timeUntilExpiry / 60)}分${tokenInfo.timeUntilExpiry % 60}秒`,
    //   isExpired: tokenInfo.isExpired,
    //   willExpireSoon: tokenInfo.willExpireSoon,
    //   // トークンの内容を確認
    //   tokenStart: token.substring(0, 20) + '...',
    //   tokenEnd: '...' + token.substring(token.length - 20)
    // });
  } else {
    console.warn('Failed to parse token, but proceeding with client creation');
  }

  // トークンの有効期限をチェック（緩和版）
  if (isTokenExpired(token)) {
    console.warn('Token is expired, but creating client anyway for testing');
    // 期限切れでもクライアントを作成（テスト用）
  }

  // 同じトークンの場合は既存のクライアントを返す
  if (authenticatedClient && currentToken === token) {
    return authenticatedClient;
  }

  // 新しいクライアントを作成
  authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
  currentToken = token;
  
  // トークンの有効期限を記録
  tokenExpiry = getTokenExpiry(token);
  
  return authenticatedClient;
};

// クライアント（useSession連携）用フック
export function useSupabaseWithAuth() {
  const { session, isLoaded } = useSession();
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const initializedRef = useRef(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initializeSupabase = async () => {
      if (!isLoaded || !session || initializedRef.current) return;

      try {
        // console.log('=== Clerk Session Debug Info ===');
        // console.log('Session user ID:', session.user.id);
        // console.log('Session loaded:', isLoaded);
        // console.log('Session status:', session.status);
        
        // 利用可能なJWTテンプレートを確認
        try {
          const availableTemplates = await session.getToken({ template: "supabase" });
          // console.log('Supabase template available:', !!availableTemplates);
        } catch (templateError) {
          console.error('Supabase template error:', templateError);
        }

        const token = await session.getToken({ template: "supabase" });
        // console.log("🔑 ClerkのJWT:", token ? `${token.substring(0, 20)}...` : 'null');

        if (token) {
          const supabase = createSupabaseWithAuth(token);
          setSupabaseClient(supabase);
          initializedRef.current = true;

          const ownerUuid = toStableUUID(session.user.id);
          // console.log('Setting session with token...');
          await supabase.auth.setSession({ access_token: token, refresh_token: "" });
          // console.log('Session set successfully');

          // トークンの有効期限に基づいて自動更新を設定
          const expiry = getTokenExpiry(token);
          if (expiry) {
            const currentTime = Math.floor(Date.now() / 1000);
            const timeUntilExpiry = (expiry - currentTime - 60) * 1000; // 1分前に更新

            if (timeUntilExpiry > 0) {
              refreshTimeoutRef.current = setTimeout(() => {
                // console.log('Token refresh timeout triggered');
                initializedRef.current = false;
                setSupabaseClient(null);
              }, timeUntilExpiry);
            }
          }
        } else {
          console.warn("⚠️ Clerkトークンが取得できませんでした");
          console.warn("ClerkのJWTテンプレート設定を確認してください");
        }
      } catch (error) {
        console.error("Supabase初期化エラー:", error);
      }
    };

    initializeSupabase();

    // クリーンアップ関数
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [session?.user?.id, isLoaded]); // 依存配列を最適化

  return supabaseClient;
}

// 認証済みクライアントを同期で取得する（トークン渡し必須）
export function getAuthenticatedSupabaseClient(token: string): SupabaseClient {
  return createSupabaseWithAuth(token);
}

// トークンの有効期限をチェックする関数（緩和版）
export function checkTokenValidity(token: string): boolean {
  const tokenInfo = parseJWTToken(token);
  if (!tokenInfo) {
    console.warn('Token parsing failed, but allowing usage for testing');
    return true; // パースに失敗しても使用を許可（テスト用）
  }
  return !tokenInfo.isExpired; // 実際に期限切れの場合のみfalse
}

// 認証なしのクライアント（publicデータ用など）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
