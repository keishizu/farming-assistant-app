import { FarmRecord, NewFarmRecord } from "@/lib/types/farm";
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "farm_records";

// ローカルストレージから全レコードを取得
export const getFarmRecords = (): FarmRecord[] => {
  if (typeof window === "undefined") return [];
  
  const records = localStorage.getItem(STORAGE_KEY);
  return records ? JSON.parse(records) : [];
};

// 指定日付のレコードを取得
export const getFarmRecordsByDate = (date: string): FarmRecord[] => {
  const records = getFarmRecords();
  return records.filter((record) => record.date === date);
};

// 最新のレコードを取得
export const getLatestFarmRecord = (): FarmRecord | null => {
  const records = getFarmRecords();
  return records.length > 0 ? records[records.length - 1] : null;
};

// レコードを保存
export const saveFarmRecord = (data: NewFarmRecord): FarmRecord => {
  const records = getFarmRecords();
  const newRecord: FarmRecord = {
    ...data,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };

  const updatedRecords = [...records, newRecord];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));

  return newRecord;
}; 