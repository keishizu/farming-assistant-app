import { SupabaseClient } from "@supabase/supabase-js";
import { CustomCrop } from "@/types/crop";

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
        const newToken = session?.getToken ? await session.getToken({ template: "supabase" }) : null;
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

// 🔽 スマート作物を取得（ログイン中ユーザーの分だけ）
export const getSmartCrops = async (
  supabase: SupabaseClient, 
  userId: string,
  session?: any
): Promise<CustomCrop[]> => {
  if (!userId) throw new Error("User not authenticated");

  console.log("Fetching smart crops for user:", userId);

  const operation = async () => {
    const { data, error } = await supabase
      .from("smart_crops")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .throwOnError();

    if (error) {
      console.error("Error fetching smart crops:", error);
      throw error;
    }

    const mappedData = data?.map(crop => ({
      ...crop,
      name: crop.crop_type,
      startDate: crop.start_date, // ISO 8601 string
      tasks: crop.tasks || [],
    })) || [];

    console.log("Mapped smart crops:", mappedData);
    return mappedData;
  };

  if (session) {
    return await retryWithTokenRefresh(operation, session, supabase);
  } else {
    return await operation();
  }
};

// 🔽 スマート作物を保存（upsert方式）
export const saveSmartCrops = async (
  supabase: SupabaseClient, 
  userId: string, 
  crops: CustomCrop[],
  session?: any
): Promise<void> => {
  if (!userId) throw new Error("User not authenticated");

  console.log("saveSmartCrops called with crops:", crops);
  console.log("Number of crops:", crops.length);

  const operation = async () => {
    if (crops.length === 0) {
      console.log("Crops array is empty, deleting all crops for user:", userId);
      // 作物が空の場合は、ユーザーの全作物を削除
      const { error: deleteError } = await supabase
        .from("smart_crops")
        .delete()
        .eq("user_id", userId);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        throw new Error(`Failed to delete smart crops: ${deleteError.message}`);
      }
      console.log("Successfully deleted all crops for user:", userId);
      return;
    }

    console.log("Processing crops for upsert:", crops.map(c => ({ id: c.id, name: c.name })));

    // 新しいデータを upsert（存在する場合は更新、存在しない場合は挿入）
    const formattedCrops = crops.map((crop) => ({
      id: crop.id,
      user_id: userId,
      crop_type: crop.name,
      start_date: crop.startDate, // ISO 8601 string
      memo: crop.memo ?? "",
      tasks: crop.tasks,
      color: crop.color,
      created_at: new Date().toISOString(),
    }));

    console.log("Formatted crops for upsert:", formattedCrops.map(c => ({ id: c.id, crop_type: c.crop_type })));

    // upsertを実行（onConflict: "id"で主キー重複時に更新）
    const { error: upsertError } = await supabase
      .from("smart_crops")
      .upsert(formattedCrops, { onConflict: "id" });

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      throw new Error(`Failed to upsert smart crops: ${upsertError.message}`);
    }

    console.log("Successfully upserted crops");

    // 保存されていない作物を削除（現在のcropsに含まれていないものを削除）
    const currentCropIds = crops.map(crop => crop.id);
    console.log("Current crop IDs:", currentCropIds);
    
    // 空の配列の場合は削除処理をスキップ
    if (currentCropIds.length > 0) {
      // より安全な削除処理：まず全データを取得して、不要なものを削除
      const { data: allCrops, error: fetchError } = await supabase
        .from("smart_crops")
        .select("id")
        .eq("user_id", userId);

      if (fetchError) {
        console.error("Fetch error:", fetchError);
        console.warn("Failed to fetch crops for cleanup:", fetchError.message);
        return;
      }

      console.log("All crops in database:", allCrops);

      // 現在のcropsに含まれていないIDを特定
      const cropsToDelete = allCrops
        ?.filter(crop => !currentCropIds.includes(crop.id))
        .map(crop => crop.id) || [];

      console.log("Crops to delete:", cropsToDelete);

      // 不要な作物を削除
      if (cropsToDelete.length > 0) {
        console.log("Deleting crops:", cropsToDelete);
        const { error: deleteError } = await supabase
          .from("smart_crops")
          .delete()
          .eq("user_id", userId)
          .in("id", cropsToDelete);

        if (deleteError) {
          console.error("Delete error:", deleteError);
          // 削除エラーは警告として扱い、処理を続行
          console.warn("Failed to delete old crops:", deleteError.message);
        } else {
          console.log("Successfully deleted old crops:", cropsToDelete);
        }
      } else {
        console.log("No crops to delete");
      }
    }
  };

  if (session) {
    return await retryWithTokenRefresh(operation, session, supabase);
  } else {
    return await operation();
  }
};

// 🔽 特定のスマート作物を更新
export const updateSmartCrop = async (
  supabase: SupabaseClient,
  userId: string,
  id: string,
  data: Partial<CustomCrop>,
  session?: any
): Promise<boolean> => {
  if (!userId) throw new Error("User not authenticated");

  const operation = async () => {
    const { error } = await supabase
      .from("smart_crops")
      .update({
        ...data,
        crop_type: data.name,
        start_date: data.startDate, // ISO 8601 string
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw new Error(`Failed to update smart crop: ${error.message}`);
    return true;
  };

  if (session) {
    return await retryWithTokenRefresh(operation, session, supabase);
  } else {
    return await operation();
  }
};

// 🔽 特定のスマート作物を削除
export const deleteSmartCrop = async (
  supabase: SupabaseClient,
  userId: string,
  id: string,
  session?: any
): Promise<boolean> => {
  if (!userId) throw new Error("User not authenticated");

  console.log("deleteSmartCrop called with userId:", userId, "cropId:", id);

  const operation = async () => {
    const { error } = await supabase
      .from("smart_crops")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Delete smart crop error:", error);
      throw new Error(`Failed to delete smart crop: ${error.message}`);
    }
    
    console.log("Successfully deleted smart crop with id:", id);
    return true;
  };

  if (session) {
    return await retryWithTokenRefresh(operation, session, supabase);
  } else {
    return await operation();
  }
};
