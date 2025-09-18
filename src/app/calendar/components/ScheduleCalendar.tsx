"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, Trash2 } from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  addYears,
  subYears,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isSameMonth,
} from "date-fns";
import { ja } from "date-fns/locale";

import { Task } from "@/types/calendar";
import { EditTaskModal } from "./edit-task-modal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/nextjs";
import { useSupabaseWithAuth } from "@/lib/supabase";

interface ScheduleCalendarProps {
  tasks: Task[];
  onUpdate?: (tasks: Task[]) => void;
}

export function ScheduleCalendar({ tasks, onUpdate }: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { toast } = useToast();
  const { userId, isLoaded } = useAuth();
  const supabase = useSupabaseWithAuth();

  const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end });

  const MAX_TASKS_PER_DAY = 1;
  const TASK_HEIGHT_REM = 1.5;

  const getTasksForDate = (date: Date) => {
    const target = format(date, "yyyy-MM-dd");
    return tasks.filter(
      (task) => target >= task.startDate && target <= task.endDate
    );
  };

  const getCropColor = (task: Task) => {
    if (!task.color) return "bg-gray-100";
    // 文字色クラス（text-green-600）を背景色クラス（bg-green-100）に変換
    const colorMatch = task.color.match(/text-(\w+)-(\d+)/);
    if (colorMatch) {
      const [, colorName, intensity] = colorMatch;
      return `bg-${colorName}-100`;
    }
    return "bg-gray-100";
  };

  const handleUpdateTask = (updatedTask: Task) => {
    if (onUpdate) {
      onUpdate(tasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      ));
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!isLoaded || !userId) {
      toast({
        title: "エラー",
        description: "認証が必要です",
        variant: "destructive",
      });
      return;
    }

    if (!supabase) {
      // console.log("Supabase client not initialized");
      return;
    }

    if (window.confirm("この提案を削除してもよろしいですか？")) {
      if (onUpdate) {
        onUpdate(tasks.filter(t => t.id !== task.id));
      }
      
      toast({
        title: "削除しました",
        description: "提案を削除しました",
      });
      
      setSelectedTask(null);
    }
  };

  return (
    <div className="w-full">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subYears(currentDate, 1))}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-lg font-semibold">
          {format(currentDate, "yyyy年MM月", { locale: ja })}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addYears(currentDate, 1))}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* カレンダー本体 */}
      <div className="calendar-grid relative">
        {/* 曜日ヘッダー */}
        {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
          <div key={day} className="calendar-header">
            {day}
          </div>
        ))}

        {/* 日付セル */}
        {days.map((date) => {
          const todayTasks = getTasksForDate(date);

          return (
            <div
              key={date.toISOString()}
              className={`calendar-cell min-h-[100px] relative ${
                isToday(date) ? "today" : ""
              } ${!isSameMonth(date, currentDate) ? "other-month" : ""}`}
              onClick={() => todayTasks.length > 0 && setSelectedDate(date)}
            >
              <div className="calendar-date relative">{format(date, "d")}</div>

              {/* 帯描画 */}
              {(() => {
                const todayTasks = getTasksForDate(date);

                return (
                  <>
                    {/* 最大1本まで帯表示 */}
                    {todayTasks.slice(0, MAX_TASKS_PER_DAY).map((task, index) => {
                      const cropColor = getCropColor(task);
                      return (
                        <div
                          key={task.id}
                          className={`calendar-bar task-bar ${cropColor}`}
                          style={{
                            top: `${0.2 + (TASK_HEIGHT_REM * (index + 1))}rem`,
                            height: "1.25rem",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                          }}
                        >
                          {task.taskName}
                        </div>
                      );
                    })}

                    {/* +N表示 */}
                    {todayTasks.length > MAX_TASKS_PER_DAY && (
                      <div
                        className="absolute left-0 right-0 mx-1 text-center text-xs text-gray-500 cursor-pointer select-none"
                        style={{
                          top: `${2 + (TASK_HEIGHT_REM * (MAX_TASKS_PER_DAY + 1))}rem`,
                        }}
                      >
                        +{todayTasks.length - MAX_TASKS_PER_DAY}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* モーダル（一覧） */}
      {selectedDate && (
        <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {format(selectedDate, "yyyy年MM月dd日", { locale: ja })}の提案
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {getTasksForDate(selectedDate).map((task) => (
                <div
                  key={task.id}
                  className="p-2 rounded-lg border hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedTask(task);
                    setSelectedDate(null);
                  }}
                >
                  <div className="font-medium">{task.cropName}</div>
                  <div className="text-sm text-gray-600">{task.taskName}</div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* モーダル（詳細） */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>提案の詳細</DialogTitle>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-4">
                <div>
                  <div className="font-medium">作物名</div>
                  <div>{selectedTask.cropName}</div>
                </div>
                <div>
                  <div className="font-medium">作業名</div>
                  <div>{selectedTask.taskName}</div>
                </div>
                <div>
                  <div className="font-medium">期間</div>
                  <div>
                    {format(new Date(selectedTask.startDate), "yyyy年MM月dd日", { locale: ja })}〜
                    {format(new Date(selectedTask.endDate), "yyyy年MM月dd日", { locale: ja })}
                  </div>
                </div>
                {selectedTask.memo && (
                  <div>
                    <div className="font-medium">メモ</div>
                    <div className="whitespace-pre-wrap">{selectedTask.memo}</div>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingTask(selectedTask);
                      setSelectedTask(null);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    編集
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteTask(selectedTask)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    削除
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* 編集モーダル */}
      {editingTask && (
        <EditTaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          task={editingTask}
          onUpdate={handleUpdateTask}
        />
      )}
    </div>
  );
}
