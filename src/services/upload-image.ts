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
  const fileExtension = file.name.split('.').pop();
  const stableUUID = generateStableUUIDFromClerkId(userId);
  const fileName = `${stableUUID}.${fileExtension}`;
  const filePath = `${userId}/${fileName}`;

  // console.log('Stable UUID:', stableUUID);

  const { data, error } = await supabase.storage
    .from('clerk-uploads')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('clerk-uploads')
    .getPublicUrl(filePath);

  return { path: filePath, signedUrl: publicUrl };
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