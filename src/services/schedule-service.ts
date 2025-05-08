import { CustomCrop } from "@/types/crop";
import { Task } from "@/types/calendar";
import { addDays, format } from "date-fns";
import { getCrops } from "./crop-storage";
import { getSmartCrops } from "./smart-crop-storage";

// カスタムスケジュールとスマートスケジュールからカレンダー用のタスクを生成
export const generateTasksFromCrops = (): Task[] => {
  const tasks: Task[] = [];
  const customCrops = getCrops();
  const smartCrops = getSmartCrops();
  const allCrops = [...customCrops, ...smartCrops];

  allCrops.forEach(crop => {
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
export const getTasksForDate = (date: Date): Task[] => {
  const allTasks = generateTasksFromCrops();
  const targetDate = format(date, "yyyy-MM-dd");

  return allTasks.filter(task => 
    targetDate >= task.startDate && targetDate <= task.endDate
  );
}; 