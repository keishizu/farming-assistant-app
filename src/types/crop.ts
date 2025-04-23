export type TaskType = "field" | "planting" | "care" | "harvest";

export interface TaskTypeConfig {
  type: TaskType;
  iconName: string;
  label: string;
}

export const TASK_TYPES: TaskTypeConfig[] = [
  { type: "field", iconName: "Tractor", label: "畑作り" },
  { type: "planting", iconName: "Sprout", label: "定植" },
  { type: "care", iconName: "Droplets", label: "管理" },
  { type: "harvest", iconName: "Wheat", label: "収穫" },
];

export interface CropTask {
  id: string;
  daysFromStart: number;
  label: string;
  taskType: TaskType;
  duration: number; // 作業日数（正の整数）
}

export interface CustomCrop {
  id: string;
  name: string;
  startDate: Date;
  memo?: string;
  tasks: CropTask[];
} 