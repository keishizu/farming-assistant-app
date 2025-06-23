import { SupabaseClient } from "@supabase/supabase-js";
import { FarmRecord, NewFarmRecord } from "@/types/farm";
import { v4 as uuidv4 } from "uuid";
import { deleteImage } from "./upload-image";

// 🔽 全レコード取得（ログイン中ユーザーの分だけ）
export const getFarmRecords = async (
  supabase: SupabaseClient,
  userId: string
): Promise<FarmRecord[]> => {
  if (!userId) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("farm_records")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  if (error) throw new Error(`Failed to fetch farm records: ${error.message}`);
  
  // データベースのカラム名をTypeScriptの型定義に変換
  return (data ?? []).map((record: any) => ({
    id: record.id,
    userId: record.user_id,
    cropId: record.crop_id || "",
    date: record.date,
    crop: record.crop,
    task: record.task,
    memo: record.memo || undefined,
    photoPath: record.photo_path || undefined,
    createdAt: record.created_at,
  }));
};

// 🔽 特定日付のレコードを取得
export const getFarmRecordsByDate = async (
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<FarmRecord[]> => {
  if (!userId) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("farm_records")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date);

  if (error) throw new Error(`Failed to fetch records by date: ${error.message}`);
  
  // データベースのカラム名をTypeScriptの型定義に変換
  return (data ?? []).map((record: any) => ({
    id: record.id,
    userId: record.user_id,
    cropId: record.crop_id || "",
    date: record.date,
    crop: record.crop,
    task: record.task,
    memo: record.memo || undefined,
    photoPath: record.photo_path || undefined,
    createdAt: record.created_at,
  }));
};

// 🔽 最新の1件を取得
export const getLatestFarmRecord = async (
  supabase: SupabaseClient,
  userId: string
): Promise<FarmRecord | null> => {
  if (!userId) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("farm_records")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw new Error(`Failed to fetch latest record: ${error.message}`);
  
  if (!data || data.length === 0) return null;
  
  const record = data[0];
  // データベースのカラム名をTypeScriptの型定義に変換
  return {
    id: record.id,
    userId: record.user_id,
    cropId: record.crop_id || "",
    date: record.date,
    crop: record.crop,
    task: record.task,
    memo: record.memo || undefined,
    photoPath: record.photo_path || undefined,
    createdAt: record.created_at,
  };
};

// 🔽 レコードを新規保存
export const saveFarmRecord = async (
  supabase: SupabaseClient,
  userId: string,
  record: NewFarmRecord
): Promise<FarmRecord> => {
  if (!userId) throw new Error("User not authenticated");

  const newRecord: FarmRecord = {
    ...record,
    id: uuidv4(),
    userId,
    createdAt: new Date().toISOString(),
  };

  const { error } = await supabase.from("farm_records").insert([
    {
      id: newRecord.id,
      user_id: newRecord.userId,
      crop_id: newRecord.cropId,
      date: newRecord.date,
      crop: newRecord.crop,
      task: newRecord.task,
      memo: newRecord.memo ?? "",
      photo_path: newRecord.photoPath ?? "",
      created_at: newRecord.createdAt,
    },
  ]);

  if (error) throw new Error(`Failed to save record: ${error.message}`);
  return newRecord;
};

// 🔽 レコードを更新
export async function updateFarmRecord(
  supabase: SupabaseClient,
  userId: string,
  token: string,
  recordId: string,
  updateData: Partial<FarmRecord>
): Promise<FarmRecord> {
  // console.log('updateFarmRecord called with:', {
  //   userId,
  //   recordId,
  //   updateData
  // });

  // データをSupabaseの形式に変換
  const transformedData: any = {
    crop_id: updateData.cropId,
    crop: updateData.crop,
    task: updateData.task,
    memo: updateData.memo,
    photo_path: updateData.photoPath,
  };

  // console.log('Transformed update data:', transformedData);

  const { data: result, error } = await supabase
    .from('farm_records')
    .update(transformedData)
    .eq('id', recordId)
    .eq('user_id', userId)
    .select()
    .single();

  // console.log('Supabase update result:', { result, error });

  if (error) {
    throw new Error(`Failed to update record: ${error.message}`);
  }

  // console.log('Record updated successfully:', result);

  return {
    id: result.id,
    userId: result.user_id,
    cropId: result.crop_id || "",
    date: result.date,
    crop: result.crop,
    task: result.task,
    memo: result.memo,
    photoPath: result.photo_path,
    createdAt: result.created_at,
  };
}

// 🔽 レコードを削除
export const deleteFarmRecord = async (
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<boolean> => {
  if (!userId) throw new Error("User not authenticated");

  // 削除前にレコード情報を取得（画像パスを取得するため）
  const { data: recordData, error: fetchError } = await supabase
    .from("farm_records")
    .select("photo_path")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116はレコードが見つからないエラー
    throw new Error(`Failed to fetch record for deletion: ${fetchError.message}`);
  }

  // レコードを削除
  const { error } = await supabase
    .from("farm_records")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to delete record: ${error.message}`);

  // 関連する画像があれば削除
  if (recordData?.photo_path) {
    try {
      // console.log('Deleting associated image:', recordData.photo_path);
      await deleteImage(supabase, recordData.photo_path);
      // console.log('Associated image deleted successfully');
    } catch (error) {
      console.error('Failed to delete associated image:', error);
    }
  }

  return true;
};
