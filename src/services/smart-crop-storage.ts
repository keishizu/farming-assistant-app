import { CustomCrop } from "@/types/crop";

const SMART_CROPS_STORAGE_KEY = "farming-assistant-smart-crops";

export function saveSmartCrops(crops: CustomCrop[]) {
  localStorage.setItem(SMART_CROPS_STORAGE_KEY, JSON.stringify(crops));
}

export function getSmartCrops(): CustomCrop[] {
  const cropsJson = localStorage.getItem(SMART_CROPS_STORAGE_KEY);
  if (!cropsJson) return [];

  try {
    const crops = JSON.parse(cropsJson);
    // 日付文字列をDateオブジェクトに変換
    return crops.map((crop: any) => ({
      ...crop,
      startDate: new Date(crop.startDate),
    }));
  } catch (error) {
    console.error("Failed to parse smart crops:", error);
    return [];
  }
} 