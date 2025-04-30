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
  color: string;
} 