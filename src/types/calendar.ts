import { TaskType } from "@/types/crop";

export interface Task {
  id: string;
  cropName: string;
  taskName: string;
  taskType: TaskType;
  startDate: string; // ISO形式 "2025-04-26"
  endDate: string;   // ISO形式 "2025-04-28"
  memo?: string;
  completed?: boolean;
  color?: string;
}

export interface Record {
  id: string;
  cropName: string;
  taskName: string;
  date: Date;
  memo?: string;
  photoUrl?: string;
}

export interface ScheduleCalendarProps {
  tasks: Task[];
}

export interface RecordCalendarProps {
  records: Record[];
  onUpdate?: (records: Record[]) => void;
} 


