import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const useSupabaseAuth = process.env.NEXT_PUBLIC_USE_SUPABASE_AUTH === 'true';

// 認証なしのクライアント（publicデータ用など）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Supabase認証用のクライアント
export const createSupabaseClient = (): SupabaseClient => {
  return createClient(supabaseUrl, supabaseAnonKey);
};

// 認証状態を管理するカスタムフック
export function useSupabaseAuthState() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 認証フラグがfalseの場合は何もしない
    if (!useSupabaseAuth) {
      setLoading(false);
      return;
    }

    // 現在のセッションを取得
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    loading,
    signIn: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    },
    signUp: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { data, error };
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      return { error };
    },
  };
}

// サーバーサイド用の認証チェック
export async function getServerSideAuth() {
  if (!useSupabaseAuth) {
    return { user: null, error: null };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  } catch (error) {
    return { user: null, error };
  }
}

// 認証が必要なページ用のミドルウェア
export function requireAuth() {
  return useSupabaseAuthState;
}
