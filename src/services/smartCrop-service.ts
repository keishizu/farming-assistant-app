import { SupabaseClient } from "@supabase/supabase-js";
import { CustomCrop } from "@/types/crop";

// 🔽 スマート作物を取得（ログイン中ユーザーの分だけ）
export const getSmartCrops = async (supabase: SupabaseClient, userId: string): Promise<CustomCrop[]> => {
  if (!userId) throw new Error("User not authenticated");

  console.log("Fetching smart crops for user:", userId);
  console.log("Using supabase client:", supabase);
  
  const { data, error } = await supabase
    .from("smart_crops")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching smart crops:", error);
    throw new Error(`Failed to fetch smart crops: ${error.message}`);
  }

  console.log("Raw data from smart_crops:", data);
  console.log("Data type:", typeof data);
  console.log("Is array:", Array.isArray(data));

  const mappedData = data?.map((crop) => ({
    ...crop,
    name: crop.crop_type,
    startDate: new Date(crop.start_date),
    tasks: crop.tasks || [],
  })) ?? [];

  console.log("Mapped smart crops:", mappedData);
  return mappedData;
};

// 🔽 スマート作物を保存（全削除 → 一括保存の上書き方式）
export const saveSmartCrops = async (supabase: SupabaseClient, userId: string, crops: CustomCrop[]): Promise<void> => {
  if (!userId) throw new Error("User not authenticated");

  try {
    console.log("Saving crops for user:", userId);
    console.log("Crops to save:", crops);

    // 既存のデータを全削除
    const { error: deleteError } = await supabase
      .from("smart_crops")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      throw new Error(`Failed to delete smart crops: ${deleteError.message}`);
    }

    // 新しいデータを insert
    const formattedCrops = crops.map((crop) => ({
      id: crop.id,
      user_id: userId,
      crop_type: crop.name,
      start_date: crop.startDate.toISOString().split("T")[0],
      memo: crop.memo ?? "",
      tasks: crop.tasks,
      color: crop.color,
      created_at: new Date().toISOString(),
    }));

    // バルク挿入を実行
    const { error: insertError } = await supabase
      .from("smart_crops")
      .insert(formattedCrops);

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to insert smart crops: ${insertError.message}`);
    }
  } catch (error) {
    console.error("Error in saveSmartCrops:", error);
    throw error;
  }
};

// 🔽 特定のスマート作物を更新
export const updateSmartCrop = async (
  supabase: SupabaseClient,
  userId: string,
  id: string,
  data: Partial<CustomCrop>
): Promise<boolean> => {
  if (!userId) throw new Error("User not authenticated");

  const { error } = await supabase
    .from("smart_crops")
    .update({
      ...data,
      crop_type: data.name,
      start_date: data.startDate?.toISOString().split("T")[0],
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to update smart crop: ${error.message}`);
  return true;
};

// 🔽 特定のスマート作物を削除
export const deleteSmartCrop = async (supabase: SupabaseClient, userId: string, id: string): Promise<boolean> => {
  if (!userId) throw new Error("User not authenticated");

  const { error } = await supabase
    .from("smart_crops")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to delete smart crop: ${error.message}`);
  return true;
};
