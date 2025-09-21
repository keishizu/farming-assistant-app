import { createClient } from "@supabase/supabase-js";
import { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// シングルトンパターンでSupabaseクライアントを管理
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return supabaseInstance;
}

// 後方互換性のためのエクスポート
export const supabase = getSupabaseClient();

// 認証付きクライアントの取得（同じインスタンスを使用）
export function getAuthenticatedClient(): SupabaseClient {
  return getSupabaseClient();
}