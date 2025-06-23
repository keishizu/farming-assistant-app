import { CustomCrop } from "@/types/crop";
import { Task } from "@/types/calendar";
import { addDays, format } from "date-fns";
import { getCustomCrops } from "./customCrop-service";
import { getSmartCrops } from "./smartCrop-service";
import { SupabaseClient } from "@supabase/supabase-js";

// カスタムスケジュールとスマートスケジュールからカレンダー用のタスクを生成（Supabase対応）
export const generateTasksFromCrops = async (supabase: SupabaseClient, userId: string, token: string): Promise<Task[]> => {
  const [customCrops, smartCrops] = await Promise.all([
    getCustomCrops(supabase, userId, token),
    getSmartCrops(supabase, userId),
  ]);

  const allCrops: CustomCrop[] = [...customCrops, ...smartCrops];
  const tasks: Task[] = [];

  allCrops.forEach((crop) => {
    crop.tasks.forEach((task) => {
      const startDate = addDays(new Date(crop.startDate), task.daysFromStart);
      const endDate = addDays(startDate, task.duration - 1);

      tasks.push({
        id: task.id,
        cropId: crop.id,
        cropName: crop.name,
        taskName: task.taskType,
        taskType: task.taskType,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        memo: task.memo,
        color: crop.color?.text || "text-green-700", // CropColorOptionのtextプロパティを使用
      });
    });
  });

  return tasks;
};

// カスタムスケジュールから特定の日付のタスクを取得（Supabase対応）
export const getTasksForDate = async (supabase: SupabaseClient, userId: string, date: Date, token: string): Promise<Task[]> => {
  const allTasks = await generateTasksFromCrops(supabase, userId, token);
  const targetDate = format(date, "yyyy-MM-dd");

  return allTasks.filter(task =>
    targetDate >= task.startDate && targetDate <= task.endDate
  ).map(task => ({
    ...task,
    color: task.color || "text-green-700" // デフォルトの色を設定
  }));
};
