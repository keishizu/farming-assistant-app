import { SupabaseClient } from "@supabase/supabase-js";
import { toStableUUID } from '../utils/user-id';

const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB
const ALLOWED_MIME_PREFIX = "image/";
const EXPIRES_IN = 60 * 60; // 1時間（秒）
const BUCKET = "clerk-uploads";

type DeleteStatus = "success" | "not_found" | "forbidden" | "error";

// ClerkのユーザーIDから安定したUUIDを生成する関数
function generateStableUUIDFromClerkId(clerkId: string): string {
  return toStableUUID(clerkId);
}

export async function uploadImage(
  file: File,
  supabase: SupabaseClient,
  userId: string
): Promise<{ path: string; signedUrl: string }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("FILE_TOO_LARGE");
  }

  if (!file.type.startsWith(ALLOWED_MIME_PREFIX)) {
    throw new Error("INVALID_MIME");
  }

  const fileExtension = file.name.split('.').pop();
  if (!fileExtension) {
    throw new Error("NO_EXTENSION");
  }

  const stableUUID = generateStableUUIDFromClerkId(userId);
  const timestamp = Date.now();
  const fileName = `${stableUUID}-${timestamp}.${fileExtension}`;
  const filePath = `${userId}/${fileName}`;

  // console.log('Stable UUID:', stableUUID);
  // console.info("[uploadImage] filePath", filePath);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // 署名付きURLを取得
  const { data: signedUrlData } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, EXPIRES_IN);

  const signedUrl = signedUrlData?.signedUrl;
  if (!signedUrl) {
    throw new Error("Failed to create signed URL");
  }

  return { path: filePath, signedUrl };
}

// パス→署名付き URL を取るヘルパー
export async function getSignedImageUrl(
  supabase: SupabaseClient,
  path: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, EXPIRES_IN);
  
  if (error) {
    console.error("Failed to create signed URL:", {
      path,
      error: error.message
    });
    
    // 署名付きURLの有効期限切れエラーの場合
    if (error.message?.includes("exp") || error.message?.includes("timestamp")) {
      throw new Error("SIGNED_URL_EXPIRED");
    }
    
    throw new Error(error.message);
  }
  
  return data?.signedUrl ?? "";
}

// 画像削除ヘルパー
export async function deleteImage(
  supabase: SupabaseClient,
  path: string
): Promise<DeleteStatus> {
  if (!path) return "error";
  
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);
    
  if (!error) return "success";
  
  console.error("Failed to delete image:", error);
  
  // エラーメッセージから状態を推測
  const errorMessage = error.message?.toLowerCase() || "";
  if (errorMessage.includes("not found") || errorMessage.includes("404")) {
    return "not_found";
  }
  if (errorMessage.includes("forbidden") || errorMessage.includes("403") || errorMessage.includes("unauthorized")) {
    return "forbidden";
  }
  
  return "error";
} 

