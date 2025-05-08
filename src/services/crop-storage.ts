import { CustomCrop, CROP_COLOR_OPTIONS } from "@/types/crop";
import { getSmartCrops } from "./smart-crop-storage";

const CROPS_STORAGE_KEY = "crops";

export function saveCrops(crops: CustomCrop[]) {
  localStorage.setItem(CROPS_STORAGE_KEY, JSON.stringify(crops));
}

export function getCrops(): CustomCrop[] {
  const cropsJson = localStorage.getItem(CROPS_STORAGE_KEY);
  const customCrops = cropsJson ? JSON.parse(cropsJson).map((crop: any) => {
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
  }) : [];

  return customCrops;
}

export function getCropNames(): string[] {
  const customCrops = getCrops();
  const smartCrops = getSmartCrops();
  const allCrops = [...customCrops, ...smartCrops];
  
  // 作物名の重複を除去
  return Array.from(new Set(allCrops.map(crop => crop.name)));
}

export function getCropByName(name: string): CustomCrop | undefined {
  const customCrops = getCrops();
  const smartCrops = getSmartCrops();
  const allCrops = [...customCrops, ...smartCrops];
  return allCrops.find(crop => crop.name === name);
}

export function getUsedTaskTypes(): string[] {
  const customCrops = getCrops();
  const smartCrops = getSmartCrops();
  const allCrops = [...customCrops, ...smartCrops];
  
  // すべての作物の作業タイプを取得し、重複を除去
  const taskTypes = new Set<string>();
  
  allCrops.forEach(crop => {
    crop.tasks.forEach(task => {
      if (task.taskType) {
        taskTypes.add(task.taskType);
      }
    });
  });
  
  return Array.from(taskTypes);
}

export function getTaskTypesForCrop(cropName: string): string[] {
  const customCrops = getCrops();
  const smartCrops = getSmartCrops();
  const allCrops = [...customCrops, ...smartCrops];
  
  // 指定された作物名に関連する作業タイプを取得
  const taskTypes = new Set<string>();
  
  allCrops.forEach(crop => {
    if (crop.name === cropName) {
      crop.tasks.forEach(task => {
        if (task.taskType) {
          taskTypes.add(task.taskType);
        }
      });
    }
  });
  
  return Array.from(taskTypes);
}
