import { createClient } from "@supabase/supabase-js";
import { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 認証なしのクライアント（publicデータ用など）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 認証付きクライアントを作成する関数
export function createSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

// 認証付きクライアントのシングルトンインスタンス
let authenticatedClient: SupabaseClient | null = null;

export function getAuthenticatedClient(): SupabaseClient {
  if (!authenticatedClient) {
    authenticatedClient = createSupabaseClient();
  }
  return authenticatedClient;
}