"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from 'react';
import { Task } from '@/types/calendar';
import { getCrops } from '@/services/crop-storage';
import { generateTasksFromCrops } from '@/services/schedule-service';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// 作物名からカラーを取得する関数
const getCropColorClass = (cropName: string): string => {
  const crops = getCrops();
  const crop = crops.find(c => c.name === cropName);
  return crop?.color.text || "text-black"; // 何もなければ黒でフォールバック
};

// localStorageから完了状態を取得する関数
const getCompletedTasks = (): Record<string, boolean> => {
  if (typeof window === 'undefined') return {};
  const completedTasks = localStorage.getItem('completed_tasks');
  return completedTasks ? JSON.parse(completedTasks) : {};
};

// localStorageに完了状態を保存する関数
const saveCompletedTasks = (completedTasks: Record<string, boolean>) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('completed_tasks', JSON.stringify(completedTasks));
};

export default function TodoScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [originalOrder, setOriginalOrder] = useState<string[]>([]);

  useEffect(() => {
    const loadTasks = () => {
      const crops = getCrops();
      const allTasks = generateTasksFromCrops(crops);
      
      // 今日の日付のタスクのみをフィルタリング
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD形式
      
      const todayTasks = allTasks.filter(task => {
        const startDate = new Date(task.startDate);
        const endDate = new Date(task.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        return today >= startDate && today <= endDate;
      });

      // 作物ごとにグループ化
      const groupedTasks = todayTasks.reduce((acc, task) => {
        if (!acc[task.cropName]) {
          acc[task.cropName] = [];
        }
        acc[task.cropName].push(task);
        return acc;
      }, {} as Record<string, Task[]>);

      // 作物ごとにソートされたタスクの配列を作成
      const sortedTasks = Object.entries(groupedTasks)
        .sort(([cropA], [cropB]) => cropA.localeCompare(cropB))
        .flatMap(([_, tasks]) => tasks);

      // 元の順序を保存
      setOriginalOrder(sortedTasks.map(task => task.id));

      // localStorageから完了状態を取得して適用
      const completedTasks = getCompletedTasks();
      const tasksWithCompletion = sortedTasks.map(task => ({
        ...task,
        completed: completedTasks[task.id] || false
      }));

      // 完了状態でソート（未完了→完了の順）
      const sortedTasksWithCompletion = tasksWithCompletion.sort((a, b) => {
        if (a.completed === b.completed) {
          // 同じ完了状態の場合は元の順序を維持
          return originalOrder.indexOf(a.id) - originalOrder.indexOf(b.id);
        }
        return a.completed ? 1 : -1;
      });

      setTasks(sortedTasksWithCompletion);
    };

    loadTasks();
  }, []);

  const handleTaskComplete = (taskId: string) => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      
      // 未完了タスクと完了タスクを分離
      const incompleteTasks = updatedTasks.filter(task => !task.completed);
      const completedTasks = updatedTasks.filter(task => task.completed);

      // 未完了タスクを元の順序で並び替え
      const sortedIncompleteTasks = incompleteTasks.sort(
        (a, b) => originalOrder.indexOf(a.id) - originalOrder.indexOf(b.id)
      );

      // 完了タスクを元の順序で並び替え
      const sortedCompletedTasks = completedTasks.sort(
        (a, b) => originalOrder.indexOf(a.id) - originalOrder.indexOf(b.id)
      );

      // 未完了タスクと完了タスクを結合
      const sortedTasks = [...sortedIncompleteTasks, ...sortedCompletedTasks];

      // localStorageに完了状態を保存
      const completedTasksMap = sortedTasks.reduce((acc, task) => {
        acc[task.id] = task.completed || false;
        return acc;
      }, {} as Record<string, boolean>);
      saveCompletedTasks(completedTasksMap);

      return sortedTasks;
    });
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-semibold text-green-800">今日のタスク</h1>
        <p className="text-gray-600">日々の農作業を管理</p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {tasks.map((task) => (
          <motion.div key={task.id} variants={item}>
            <Card className={`p-4 transition-colors duration-200 ${task.completed ? 'bg-gray-100' : ''}`}>
              <div className="flex items-start gap-4">
                <Checkbox 
                  id={`task-${task.id}`} 
                  className="mt-1"
                  checked={task.completed}
                  onCheckedChange={() => handleTaskComplete(task.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <label
                      htmlFor={`task-${task.id}`}
                      className={`text-lg font-medium cursor-pointer ${task.completed ? 'line-through text-gray-500' : ''}`}
                    >
                      <span className={`inline-block ${task.completed ? 'text-gray-500' : getCropColorClass(task.cropName)} ${task.completed ? 'line-through' : ''}`}>
                        {task.cropName}
                      </span>
                      <span className="text-foreground">{`：${task.taskName}作業`}</span>
                    </label>
                  </div>
                  {task.memo && (
                    <p className={`text-sm text-gray-600 mt-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                      {task.memo}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
