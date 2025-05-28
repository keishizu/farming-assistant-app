import { createClient } from "@supabase/supabase-js";
import { SupabaseClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Clerkトークンを使って SupabaseClient を生成する関数
export const createSupabaseWithAuth = (token: string): SupabaseClient => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};


// クライアント（useSession連携）用フック
export function useSupabaseWithAuth() {
  const { session, isLoaded } = useSession();
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    const initializeSupabase = async () => {
      if (!isLoaded || !session) return;

      const token = await session.getToken({ template: "supabase" });
      console.log("🔑 ClerkのJWT:", token);

      if (token) {
        const supabase = createSupabaseWithAuth(token);
        setSupabaseClient(supabase);
      } else {
        console.warn("⚠️ Clerkトークンが取得できませんでした");
      }
    };

    initializeSupabase();
  }, [session, isLoaded]);

  return supabaseClient;
}

// 認証済みクライアントを同期で取得する（トークン渡し必須）
export function getAuthenticatedSupabaseClient(token: string): SupabaseClient {
  return createSupabaseWithAuth(token);
}

// 認証なしのクライアント（publicデータ用など）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
