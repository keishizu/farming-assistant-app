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
export const updateFarmRecord = async (
  supabase: SupabaseClient,
  userId: string,
  token: string, // 🔐 将来のRLSチェック用途に含めて維持（現時点で未使用でもOK）
  id: string,
  data: Partial<NewFarmRecord>
): Promise<boolean> => {
  if (!userId) throw new Error("User not authenticated");

  console.log('updateFarmRecord called with:', {
    userId,
    id,
    data,
    token: token ? 'present' : 'missing'
  });

  // TypeScriptの型定義をデータベースのカラム名に変換
  const updateData: any = {};
  if (data.crop !== undefined) updateData.crop = data.crop;
  if (data.task !== undefined) updateData.task = data.task;
  if (data.memo !== undefined) updateData.memo = data.memo;
  if (data.photoPath !== undefined) updateData.photo_path = data.photoPath;
  if (data.date !== undefined) updateData.date = data.date;

  console.log('Transformed update data:', updateData);

  const { data: result, error } = await supabase
    .from("farm_records")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", userId)
    .select();

  console.log('Supabase update result:', { result, error });

  if (error) {
    console.error('Supabase update error:', error);
    throw new Error(`Failed to update record: ${error.message}`);
  }

  console.log('Record updated successfully:', result);
  return true;
};

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

  // 画像ファイルがある場合は削除
  if (recordData?.photo_path) {
    try {
      console.log('Deleting associated image:', recordData.photo_path);
      await deleteImage(supabase, recordData.photo_path);
      console.log('Associated image deleted successfully');
    } catch (imageError) {
      console.error("Failed to delete associated image:", imageError);
      // 画像削除に失敗してもレコード削除は成功とする（警告のみ）
      // 必要に応じて手動で削除してもらう
    }
  }

  return true;
};
