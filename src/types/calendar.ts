export type TaskDisplayRange = {
  id: string;
  cropName: string;
  taskName: string;
  startDate: string;
  endDate: string;
};

export type WorkRecord = {
  id: string;
  crop: string;
  task: string;
  memo?: string;
  photoUrl?: string;
  createdAt: string;
};

export interface ScheduleCalendarProps {
  tasks: TaskDisplayRange[];
  workRecords: WorkRecord[];
} 