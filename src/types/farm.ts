export interface FarmRecord {
  id: string;
  userId: string;
  date: string;
  crop: string;
  task: string;
  memo?: string;
  photoPath?: string;
  createdAt: string;
}

export type NewFarmRecord = Omit<FarmRecord, "id" | "createdAt">; 