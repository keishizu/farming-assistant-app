import { v4 as uuidv4 } from "uuid";
import { SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { toStableUUID } from '../utils/user-id';

const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB
const EXPIRES_IN = 60 * 60; // 1時間（秒）

// ClerkのユーザーIDから安定したUUIDを生成する関数
function generateStableUUIDFromClerkId(clerkId: string): string {
  return toStableUUID(clerkId);
}

export async function uploadImage(
  file: File,
  supabase: SupabaseClient,
  userId: string
): Promise<{ path: string; signedUrl: string }> {
  // ファイルサイズチェック
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("ファイルサイズは6MB以下にしてください。");
  }

  // MIMEタイプチェック
  if (!file.type.startsWith("image/")) {
    throw new Error("画像ファイルのみアップロード可能です。");
  }

  // ファイル拡張子の取得
  const extension = file.name.split(".").pop();
  if (!extension) {
    throw new Error("ファイル拡張子が見つかりません。");
  }

  // アップロードパスの生成（安定したUUIDを使用）
  const stableUUID = generateStableUUIDFromClerkId(userId);
  console.log('Stable UUID:', stableUUID);
  const path = `${stableUUID}/${uuidv4()}.${extension}`;

  // ファイルのアップロード
  const { error: uploadError } = await supabase.storage
    .from("clerk-uploads")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true
    });

  if (uploadError) {
    throw new Error(`アップロードに失敗しました: ${uploadError.message}`);
  }

  // 署名付きURLの生成
  const { data, error: signedUrlError } = await supabase.storage
    .from("clerk-uploads")
    .createSignedUrl(path, EXPIRES_IN);

  if (signedUrlError || !data?.signedUrl) {
    throw new Error(`署名付きURLの生成に失敗しました: ${signedUrlError?.message}`);
  }

  return { path, signedUrl: data.signedUrl };
}

// パス→署名付き URL を取るヘルパー
export async function getSignedImageUrl(
  supabase: SupabaseClient,
  path: string
): Promise<string> {
  const { data } = await supabase.storage
    .from("clerk-uploads")
    .createSignedUrl(path, EXPIRES_IN);
  return data?.signedUrl ?? "";
}

// 画像削除ヘルパー
export async function deleteImage(
  supabase: SupabaseClient,
  path: string
): Promise<void> {
  if (!path) return;
  
  const { error } = await supabase.storage
    .from("clerk-uploads")
    .remove([path]);
    
  if (error) {
    console.error("Failed to delete image:", error);
    throw new Error(`画像の削除に失敗しました: ${error.message}`);
  }
} 