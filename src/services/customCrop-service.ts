import { SupabaseClient } from "@supabase/supabase-js";
import { CustomCrop, CROP_COLOR_OPTIONS } from "@/types/crop";
import { getAuthenticatedSupabaseClient } from "@/lib/supabase";

// 🔽 CustomCrop取得（ログイン中ユーザーのデータのみ）
export async function getCustomCrops(
  authenticatedSupabase: SupabaseClient,
  userId: string,
  token: string
): Promise<CustomCrop[]> {
  // console.log("Fetching custom crops for user:", userId);
  // console.log("Using supabase client:", authenticatedSupabase);

  try {
    // テーブル構造を確認
    const { data: tableInfo, error: tableError } = await authenticatedSupabase
      .from('custom_crops')
      .select('*')
      .limit(1);

    // console.log("Table structure:", tableInfo);

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

    // console.log("Raw data from custom_crops for user:", data);
    // console.log("Data type:", typeof data);
    // console.log("Is array:", Array.isArray(data));
    // console.log("Data structure:", JSON.stringify(data, null, 2));

    if (!data || !Array.isArray(data)) {
      console.warn("No data or invalid data format returned from custom_crops");
      return [];
    }

    const mappedData = data.map((crop: any) => {
      // console.log("Processing crop:", crop);
      return {
        id: crop.id,
        name: crop.name,
        startDate: crop.start_date, // ISO 8601 string
        memo: crop.memo,
        tasks: crop.tasks || [],
        color: crop.color || CROP_COLOR_OPTIONS[0],
      };
    });

    // console.log("Mapped custom crops:", mappedData);
    return mappedData;
  } catch (error) {
    console.error("Error in getCustomCrops:", error);
    throw error;
  }
}

// 🔽 CustomCrop保存
export const saveCustomCrop = async (supabase: SupabaseClient, userId: string, crops: CustomCrop[]): Promise<void> => {
  if (!userId) throw new Error("User not authenticated");
  if (!supabase) throw new Error("Supabase client not initialized");

  try {
    
    // デバッグ用：挿入するデータの構造を確認
    const dataToInsert = crops.map(crop => {
      const { startDate, ...rest } = crop;
      const formattedData = {
        ...rest,
        user_id: userId,
        start_date: startDate, // ISO 8601 string
      };
      // console.log("Formatted crop data:", JSON.stringify(formattedData, null, 2));
      return formattedData;
    });

    // console.log("Attempting to insert crops for user:", userId);
    // console.log("Total crops to insert:", dataToInsert.length);

    // 作物データを保存
    const { data, error: insertError } = await supabase
      .from("custom_crops")
      .upsert(dataToInsert)
      .select();

    if (insertError) {
      console.error("Insert error details:", insertError);
      console.error("Error code:", insertError.code);
      console.error("Error message:", insertError.message);
      console.error("Error details:", insertError.details);
      
      if (insertError.code === '42501') {
        throw new Error("アクセス権限がありません。RLSポリシーを確認してください。");
      }
      
      throw new Error(`Failed to insert crops: ${insertError.message}`);
    }

    // console.log("Successfully inserted crops:", data);
  } catch (error) {
    console.error("Error in saveCustomCrop:", error);
    throw error;
  }
};

// 🔽 CustomCrop更新
export const updateCustomCrop = async (supabase: SupabaseClient, userId: string, cropId: string, updates: Partial<CustomCrop>): Promise<void> => {
  if (!userId) throw new Error("User not authenticated");

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

// 🔽 CustomCrop削除
export const deleteCustomCrop = async (supabase: SupabaseClient, userId: string, cropId: string): Promise<void> => {
  if (!userId) throw new Error("User not authenticated");

  const { error: deleteError } = await supabase
    .from("custom_crops")
    .delete()
    .eq("id", cropId)
    .eq("user_id", userId);

  if (deleteError) throw new Error(`Failed to delete crop: ${deleteError.message}`);
};

export const saveCustomCrops = async (supabase: SupabaseClient, userId: string, crops: CustomCrop[]): Promise<CustomCrop[]> => {
  if (!userId) throw new Error("User not authenticated");

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
    // console.log("Formatted crop data:", JSON.stringify(formattedData, null, 2));
    return formattedData;
  });

  // console.log("Attempting to insert crops for user:", userId);
  // console.log("Total crops to insert:", dataToInsert.length);

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

  // console.log("Successfully inserted crops:", data);
  return data?.map(crop => ({
    ...crop,
    startDate: crop.start_date, // ISO 8601 string
    tasks: crop.tasks || [],
  })) || [];
};


