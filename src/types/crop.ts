export type TaskType = "field" | "planting" | "care" | "harvest" | "mulch" | "fertilizer" | "weed" | "pest" | "other";

export interface TaskTypeConfig {
  type: TaskType;
  label: string;
}

export const TASK_TYPES: TaskTypeConfig[] = [
  { type: "field", label: "耕耘" },
  { type: "planting", label: "定植" },
  { type: "care",  label: "水やり" },
  { type: "harvest",  label: "収穫" },
  { type: "mulch", label: "マルチ張り" },
  { type: "fertilizer", label: "追肥" },
  { type: "weed", label: "除草" },
  { type: "pest", label: "害虫獣対策" },
  { type: "other", label: "その他" },
];

export interface CropTask {
  id: string;
  daysFromStart: number;
  label: string;
  taskType: TaskType;
  duration: number; // 作業日数（正の整数）
  memo?: string;
}

export interface CustomCrop {
  id: string;
  name: string;
  startDate: Date;
  memo?: string;
  tasks: CropTask[];
  color: CropColorOption;
}

// イメージカラーの選択肢
export interface CropColorOption {
  text: string; // 文字色クラス
  bg: string;   // 背景色クラス
  label: string; // 表示用ラベル
}


export const CROP_COLOR_OPTIONS: CropColorOption[] = [
  { text: "text-red-600", bg: "bg-red-100", label: "赤" },
  { text: "text-orange-600", bg: "bg-orange-100", label: "オレンジ" },
  { text: "text-yellow-600", bg: "bg-yellow-100", label: "黄" },
  { text: "text-green-600", bg: "bg-green-100", label: "緑" },
  { text: "text-blue-600", bg: "bg-blue-100", label: "青" },
  { text: "text-purple-600", bg: "bg-purple-100", label: "紫" },
  { text: "text-pink-600", bg: "bg-pink-100", label: "ピンク" },
];