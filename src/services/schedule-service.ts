import { CustomCrop } from "@/types/crop";
import { Task } from "@/types/calendar";
import { addDays, format } from "date-fns";

// カスタムスケジュールからカレンダー用のタスクを生成
export const generateTasksFromCrops = (crops: CustomCrop[]): Task[] => {
  const tasks: Task[] = [];

  crops.forEach(crop => {
    crop.tasks.forEach(task => {
      const startDate = addDays(crop.startDate, task.daysFromStart);
      const endDate = addDays(startDate, task.duration - 1);

      tasks.push({
        id: task.id,
        cropName: crop.name,
        taskName: task.taskType,
        taskType: task.taskType,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        memo: task.memo,
      });
    });
  });

  return tasks;
};

// カスタムスケジュールから特定の日付のタスクを取得
export const getTasksForDate = (crops: CustomCrop[], date: Date): Task[] => {
  const allTasks = generateTasksFromCrops(crops);
  const targetDate = format(date, "yyyy-MM-dd");

  return allTasks.filter(task => 
    targetDate >= task.startDate && targetDate <= task.endDate
  );
}; 