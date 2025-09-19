"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { Task } from "@/types/calendar";
import { getTasksForDate } from "@/services/schedule-service";
import { useAuth } from "@/hooks/useAuth";
import { getCompletedTasks, saveCompletedTasks as saveTasksToSupabase } from "@/services/task-service";
import { useToast } from "@/hooks/use-toast";
import { getAuthenticatedClient } from "@/lib/supabase";

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

export default function TodoScreen() {
  const { user, isAuthenticated, getToken } = useAuth();
  const userId = user?.id;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [originalOrder, setOriginalOrder] = useState<string[]>([]);
  const { toast } = useToast();
  const supabase = getAuthenticatedClient();

  useEffect(() => {
    if (!userId || !isAuthenticated) return;

    const loadTasks = async () => {
      try {
        const token = await getToken();
        if (!token) {
          console.error("認証トークンの取得に失敗しました");
          toast({
            title: "エラー",
            description: "認証トークンの取得に失敗しました",
            variant: "destructive",
          });
          return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayTasks = await getTasksForDate(supabase, userId, today, token);
        const completedMap = await getCompletedTasks(supabase, userId);

        const groupedTasks = todayTasks.reduce((acc, task) => {
          if (!acc[task.cropName]) acc[task.cropName] = [];
          acc[task.cropName].push(task);
          return acc;
        }, {} as Record<string, Task[]>);

        const sortedTasks = Object.entries(groupedTasks)
          .sort(([a], [b]) => a.localeCompare(b))
          .flatMap(([_, taskList]) => taskList);

        setOriginalOrder(sortedTasks.map(task => task.id));

        const withStatus = sortedTasks.map(task => ({
          ...task,
          completed: completedMap[task.id] || false,
        }));

        const sortedWithStatus = withStatus.sort((a, b) => {
          if (a.completed === b.completed) {
            return originalOrder.indexOf(a.id) - originalOrder.indexOf(b.id);
          }
          return a.completed ? 1 : -1;
        });

        setTasks(sortedWithStatus);
      } catch (error: any) {
        console.error("タスクの読み込みに失敗しました:", error);
        
        // JWT expired エラーの場合、セッション切れのメッセージを表示
        if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && 
            (error.message.includes('JWT expired') || (error as any)?.code === 'PGRST301')) {
          toast({
            title: "セッション切れ",
            description: "ページを再読み込みしてください。",
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "エラー",
          description: "タスクの読み込みに失敗しました",
          variant: "destructive",
        });
      }
    };

    loadTasks();
  }, [userId, isAuthenticated, supabase, getToken, toast]);

  const handleTaskComplete = async (taskId: string) => {
    setTasks(prev => {
      const updated = prev.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );

      const incomplete = updated.filter(t => !t.completed);
      const complete = updated.filter(t => t.completed);

      const sorted = [
        ...incomplete.sort((a, b) => originalOrder.indexOf(a.id) - originalOrder.indexOf(b.id)),
        ...complete.sort((a, b) => originalOrder.indexOf(a.id) - originalOrder.indexOf(b.id)),
      ];

      const completedMap = sorted.reduce((acc, task) => {
        acc[task.id] = task.completed || false;
        return acc;
      }, {} as Record<string, boolean>);

      if (userId && supabase) {
        saveTasksToSupabase(supabase, userId, completedMap);
      }
      return sorted;
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
            <Card
              className={`p-4 transition-colors duration-200 ${
                task.completed ? "bg-gray-100" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <Checkbox
                  id={`task-${task.id}`}
                  className="mt-1"
                  checked={task.completed}
                  onCheckedChange={() => handleTaskComplete(task.id)}
                />
                <div className="flex-1">
                  <label
                    htmlFor={`task-${task.id}`}
                    className={`text-lg font-medium cursor-pointer ${
                      task.completed ? "line-through text-gray-500" : ""
                    }`}
                  >
                    <span className={`inline-block ${task.completed ? "text-gray-500" : task.color || "text-green-600"}`}>
                      {task.cropName}
                    </span>
                    <span className="text-foreground">{`：${task.taskName}作業`}</span>
                  </label>
                  {task.memo && (
                    <p
                      className={`text-sm text-gray-600 mt-1 ${
                        task.completed ? "line-through text-gray-500" : ""
                      }`}
                    >
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
