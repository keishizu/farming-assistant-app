import { SupabaseClient } from "@supabase/supabase-js";
import { FarmRecord, NewFarmRecord } from "@/types/farm";
import { v4 as uuidv4 } from "uuid";

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
  return data ?? [];
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
  return data ?? [];
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
  return data?.[0] ?? null;
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
      photo_url: newRecord.photoUrl ?? "",
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

  const { error } = await supabase
    .from("farm_records")
    .update({ ...data })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to update record: ${error.message}`);
  return true;
};

// 🔽 レコードを削除
export const deleteFarmRecord = async (
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<boolean> => {
  if (!userId) throw new Error("User not authenticated");

  const { error } = await supabase
    .from("farm_records")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to delete record: ${error.message}`);
  return true;
};
