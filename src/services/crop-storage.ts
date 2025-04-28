import { CustomCrop } from "@/types/crop";

const CROPS_STORAGE_KEY = "farming-assistant-crops";

export function saveCrops(crops: CustomCrop[]) {
  localStorage.setItem(CROPS_STORAGE_KEY, JSON.stringify(crops));
}

export function getCrops(): CustomCrop[] {
  const cropsJson = localStorage.getItem(CROPS_STORAGE_KEY);
  if (!cropsJson) return [];
  
  const crops = JSON.parse(cropsJson);
  // 日付をDate型に変換
  return crops.map((crop: any) => ({
    ...crop,
    startDate: new Date(crop.startDate),
  }));
}

export function getCropNames(): string[] {
  const crops = getCrops();
  return crops.map(crop => crop.name);
} 