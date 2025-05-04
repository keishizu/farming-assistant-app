export type TaskType = string;

export interface CropTask {
  id: string;
  daysFromStart: number;
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