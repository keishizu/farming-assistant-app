import { SupabaseClient } from "@supabase/supabase-js";
import { CustomCrop, CROP_COLOR_OPTIONS } from "@/types/crop";
import { getAuthenticatedSupabaseClient } from "@/lib/supabase";

// トークン更新を試行する関数
const retryWithTokenRefresh = async <T>(
  operation: () => Promise<T>,
  session: any,
  supabase: SupabaseClient
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    // JWT expired エラーの場合、トークン更新を試行
    if (error?.message?.includes('JWT expired') || error?.code === 'PGRST301') {
      console.log('JWT expired, attempting token refresh...');
      
      try {
        // 新しいトークンを取得
        const newToken = await session.getToken({ template: "supabase" });
        if (newToken) {
          // 新しいトークンでSupabaseクライアントを更新
          await supabase.auth.setSession({ access_token: newToken, refresh_token: "" });
          
          // 操作を再試行
          console.log('Token refreshed, retrying operation...');
          return await operation();
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }
    
    // その他のエラーまたはトークン更新に失敗した場合は元のエラーを投げる
    throw error;
  }
};

// 🔽 CustomCrop取得（ログイン中ユーザーのデータのみ）
export async function getCustomCrops(
  authenticatedSupabase: SupabaseClient,
  userId: string,
  token: string,
  session?: any
): Promise<CustomCrop[]> {
  console.log("Fetching custom crops for user:", userId);

  const operation = async () => {
    // テーブル構造を確認
    const { data: tableInfo, error: tableError } = await authenticatedSupabase
      .from('custom_crops')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error("Table structure check failed:", tableError);
      throw new Error(`Failed to check table structure: ${tableError.message}`);
    }

    // データを取得
    const { data, error } = await authenticatedSupabase
      .from('custom_crops')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error("Failed to fetch custom crops:", error);
      throw new Error(`Failed to fetch custom crops: ${error.message}`);
    }

    if (!data || !Array.isArray(data)) {
      console.warn("No data or invalid data format returned from custom_crops");
      return [];
    }

    const mappedData = data.map((crop: any) => {
      return {
        id: crop.id,
        name: crop.name,
        startDate: crop.start_date, // ISO 8601 string
        memo: crop.memo,
        tasks: crop.tasks || [],
        color: crop.color || CROP_COLOR_OPTIONS[0],
      };
    });

    console.log("Mapped custom crops:", mappedData);
    return mappedData;
  };

  if (session) {
    return await retryWithTokenRefresh(operation, session, authenticatedSupabase);
  } else {
    return await operation();
  }
}

// 🔽 CustomCrop保存
export const saveCustomCrop = async (
  supabase: SupabaseClient, 
  userId: string, 
  crops: CustomCrop[],
  session?: any
): Promise<void> => {
  if (!userId) throw new Error("User not authenticated");
  if (!supabase) throw new Error("Supabase client not initialized");

  const operation = async () => {
    if (crops.length === 0) {
      // 作物が空の場合は、ユーザーの全作物を削除
      const { error: deleteError } = await supabase
        .from("custom_crops")
        .delete()
        .eq("user_id", userId);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        throw new Error(`Failed to delete custom crops: ${deleteError.message}`);
      }
      return;
    }

    // デバッグ用：挿入するデータの構造を確認
    const dataToInsert = crops.map(crop => {
      const { startDate, ...rest } = crop;
      const formattedData = {
        ...rest,
        user_id: userId,
        start_date: startDate, // ISO 8601 string
      };
      return formattedData;
    });

    // 作物データをupsert（存在する場合は更新、存在しない場合は挿入）
    const { data, error: upsertError } = await supabase
      .from("custom_crops")
      .upsert(dataToInsert, { onConflict: "id" })
      .select();

    if (upsertError) {
      console.error("Upsert error details:", upsertError);
      console.error("Error code:", upsertError.code);
      console.error("Error message:", upsertError.message);
      console.error("Error details:", upsertError.details);
      
      if (upsertError.code === '42501') {
        throw new Error("アクセス権限がありません。RLSポリシーを確認してください。");
      }
      
      throw new Error(`Failed to upsert crops: ${upsertError.message}`);
    }

    console.log("Successfully upserted crops:", data);
  };

  if (session) {
    return await retryWithTokenRefresh(operation, session, supabase);
  } else {
    return await operation();
  }
};

// 🔽 CustomCrop更新
export const updateCustomCrop = async (
  supabase: SupabaseClient, 
  userId: string, 
  cropId: string, 
  updates: Partial<CustomCrop>,
  session?: any
): Promise<void> => {
  if (!userId) throw new Error("User not authenticated");

  const operation = async () => {
    const { startDate, ...rest } = updates;
    const { error: updateError } = await supabase
      .from("custom_crops")
      .update({
        ...rest,
        start_date: startDate, // ISO 8601 string
      })
      .eq("id", cropId)
      .eq("user_id", userId);

    if (updateError) throw new Error(`Failed to update crop: ${updateError.message}`);
  };

  if (session) {
    return await retryWithTokenRefresh(operation, session, supabase);
  } else {
    return await operation();
  }
};

// 🔽 CustomCrop削除
export const deleteCustomCrop = async (
  supabase: SupabaseClient, 
  userId: string, 
  cropId: string,
  session?: any
): Promise<void> => {
  if (!userId) throw new Error("User not authenticated");

  const operation = async () => {
    const { error: deleteError } = await supabase
      .from("custom_crops")
      .delete()
      .eq("id", cropId)
      .eq("user_id", userId);

    if (deleteError) throw new Error(`Failed to delete crop: ${deleteError.message}`);
  };

  if (session) {
    return await retryWithTokenRefresh(operation, session, supabase);
  } else {
    return await operation();
  }
};

export const saveCustomCrops = async (
  supabase: SupabaseClient, 
  userId: string, 
  crops: CustomCrop[],
  session?: any
): Promise<CustomCrop[]> => {
  if (!userId) throw new Error("User not authenticated");

  const operation = async () => {
    const authenticatedSupabase = getAuthenticatedSupabaseClient(userId);

    const dataToInsert = crops.map(crop => {
      const formattedData = {
        id: crop.id,
        user_id: userId,
        name: crop.name,
        start_date: crop.startDate, // ISO 8601 string
        memo: crop.memo,
        tasks: crop.tasks,
        color: crop.color,
      };
      return formattedData;
    });

    // 作物データを保存
    const { data, error } = await authenticatedSupabase
      .from("custom_crops")
      .upsert(dataToInsert, { onConflict: "id" })
      .select()
      .throwOnError();

    if (error) {
      console.error("Error saving custom crops:", error);
      throw error;
    }

    return data?.map(crop => ({
      ...crop,
      startDate: crop.start_date, // ISO 8601 string
      tasks: crop.tasks || [],
    })) || [];
  };

  if (session) {
    return await retryWithTokenRefresh(operation, session, supabase);
  } else {
    return await operation();
  }
};


