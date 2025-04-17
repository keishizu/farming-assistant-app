export type TaskStage =
  | "畑の準備①"
  | "畑の準備②"
  | "畑の準備③"
  | "播種"
  | "定植"
  | "初期管理①"
  | "初期管理②"
  | "中期管理①"
  | "中期管理②"
  | "後期管理"
  | "収穫";

export type TaskType = "field" | "planting" | "care" | "harvest";

export interface CropTask {
  id: string;
  daysFromStart: number;
  stage: TaskStage;
  label: string;
  uiText: string;
  taskType?: TaskType;
}

export interface CustomCrop {
  id: string;
  name: string;
  startDate: Date;
  memo?: string;
  tasks: CropTask[];
} 