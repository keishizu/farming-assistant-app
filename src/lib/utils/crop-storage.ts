import { CustomCrop } from "@/types/crop";

const STORAGE_KEY = "farming-assistant-crops";

export function saveCrops(crops: CustomCrop[]): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(crops));
  } catch (error) {
    console.error("作物データの保存に失敗しました:", error);
  }
}

export function getCrops(): CustomCrop[] {
  if (typeof window === "undefined") return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const crops = JSON.parse(data) as CustomCrop[];
    // Dateオブジェクトに変換
    return crops.map(crop => ({
      ...crop,
      startDate: new Date(crop.startDate),
    }));
  } catch (error) {
    console.error("作物データの取得に失敗しました:", error);
    return [];
  }
} 