import { SupabaseClient } from "@supabase/supabase-js";
import { CustomCrop } from "@/types/crop";
import { getAuthenticatedSupabaseClient } from "@/lib/supabase";

// 🔽 CustomCrop取得（ログイン中ユーザーのデータのみ）
export const getCustomCrops = async (supabase: SupabaseClient, userId: string, token: string): Promise<CustomCrop[]> => {
  if (!userId || !token) throw new Error("User not authenticated");

  const authenticatedSupabase = getAuthenticatedSupabaseClient(token);

  console.log("Fetching custom crops for user:", userId);
  console.log("Using supabase client:", authenticatedSupabase);

  try {
    // テーブル構造の確認
    const { data: tableInfo, error: tableError } = await authenticatedSupabase
      .from("custom_crops")
      .select("*")
      .limit(1);

    console.log("Table structure:", tableInfo);
    if (tableError) {
      console.error("Error checking table structure:", tableError);
    }

    // データの取得
    const { data, error } = await authenticatedSupabase
      .from("custom_crops")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .throwOnError();

    if (error) {
      console.error("Error fetching custom crops:", error);
      throw error;
    }

    console.log("Raw data from custom_crops for user:", data);
    console.log("Data type:", typeof data);
    console.log("Is array:", Array.isArray(data));
    console.log("Data structure:", JSON.stringify(data, null, 2));
    
    const mappedData = data?.map(crop => {
      console.log("Processing crop:", crop);
      return {
        ...crop,
        startDate: new Date(crop.start_date),
        tasks: crop.tasks || [],
      };
    }) || [];

    console.log("Mapped custom crops:", mappedData);
    return mappedData;
  } catch (error) {
    console.error("Error in getCustomCrops:", error);
    throw error;
  }
};

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
        start_date: startDate.toISOString(),
      };
      console.log("Formatted crop data:", JSON.stringify(formattedData, null, 2));
      return formattedData;
    });

    console.log("Attempting to insert crops for user:", userId);
    console.log("Total crops to insert:", dataToInsert.length);

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

    console.log("Successfully inserted crops:", data);
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
      start_date: startDate?.toISOString(),
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


