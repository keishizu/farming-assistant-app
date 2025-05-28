import { getAuthenticatedSupabaseClient } from "@/lib/supabase";

// ✅ Supabaseから作物名の一覧を取得（カスタム＋スマート）
export const getCropNames = async (
  userId: string,
  token: string
): Promise<string[]> => {
  if (!userId || !token) throw new Error("User not authenticated");

  const supabase = getAuthenticatedSupabaseClient(token);

  const [customRes, smartRes] = await Promise.all([
    supabase.from("custom_crops").select("name").eq("user_id", userId),
    supabase.from("smart_crops").select("crop_type").eq("user_id", userId),
  ]);

  if (customRes.error || smartRes.error) {
    console.error("getCropNames error:", customRes.error || smartRes.error);
    return [];
  }

  const customNames = customRes.data.map((c) => c.name);
  const smartNames = smartRes.data.map((c) => c.crop_type);

  return Array.from(new Set([...customNames, ...smartNames]));
};

// ✅ Supabaseから該当作物の作業タイプ一覧を取得
export const getTaskTypesForCrop = async (
  userId: string,
  cropName: string,
  token: string
): Promise<string[]> => {
  if (!userId || !token) throw new Error("User not authenticated");

  const supabase = getAuthenticatedSupabaseClient(token);

  const [customRes, smartRes] = await Promise.all([
    supabase
      .from("custom_crops")
      .select("tasks")
      .eq("user_id", userId)
      .eq("name", cropName),

    supabase
      .from("smart_crops")
      .select("tasks")
      .eq("user_id", userId)
      .eq("crop_type", cropName),
  ]);

  if (customRes.error || smartRes.error) {
    console.error("getTaskTypesForCrop error:", customRes.error || smartRes.error);
    return [];
  }

  const allTasks = [
    ...(customRes.data?.flatMap((c) => c.tasks) || []),
    ...(smartRes.data?.flatMap((c) => c.tasks) || []),
  ];

  const taskTypes = allTasks.map((t) => t.taskType).filter(Boolean);
  return Array.from(new Set(taskTypes));
};
