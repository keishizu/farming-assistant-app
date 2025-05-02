import { CustomCrop, CROP_COLOR_OPTIONS } from "@/types/crop";

const CROPS_STORAGE_KEY = "farming-assistant-crops";

export function saveCrops(crops: CustomCrop[]) {
  localStorage.setItem(CROPS_STORAGE_KEY, JSON.stringify(crops));
}

export function getCrops(): CustomCrop[] {
  const cropsJson = localStorage.getItem(CROPS_STORAGE_KEY);
  if (!cropsJson) return [];

  const crops = JSON.parse(cropsJson);
  return crops.map((crop: any) => {
    const startDate = new Date(crop.startDate);

    // ✅ colorが文字列だったら、新形式に変換する
    let color = crop.color;
    if (typeof color === "string") {
      const matched = CROP_COLOR_OPTIONS.find(opt => opt.bg === color);
      color = matched
        ? { text: matched.text, bg: matched.bg }
        : { text: "text-black", bg: color }; // bgだけ残す
    }

    return {
      ...crop,
      startDate,
      color,
    };
  });
}

export function getCropNames(): string[] {
  const crops = getCrops();
  return crops.map(crop => crop.name);
}

export function getUsedTaskTypes(): string[] {
  const crops = getCrops();
  const types = crops.flatMap(crop => crop.tasks.map(task => task.taskType));
  return Array.from(new Set(types));
}
