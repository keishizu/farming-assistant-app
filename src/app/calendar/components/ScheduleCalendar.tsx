"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
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
  isSameDay,
  addDays,
} from "date-fns";
import { ja } from "date-fns/locale";

import { Task } from "@/types/calendar";
import { dummyTasks } from "@/data/dummyData";

interface ScheduleCalendarProps {
  tasks: Task[];
}

export function ScheduleCalendar({ tasks }: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end });

  const MAX_TASKS_PER_DAY = 1; // 最大1本まで帯を表示
  const TASK_HEIGHT_REM = 1.5; // 帯1本分の高さ

  const getTasksForDate = (date: Date) => {
    const target = format(date, "yyyy-MM-dd");
    return tasks.filter(
      (task) => target >= task.startDate && target <= task.endDate
    );
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
                    {todayTasks.slice(0, MAX_TASKS_PER_DAY).map((task, index) => (
                      <div
                        key={task.id}
                        className="task-bar absolute left-0 right-0 mx-1 px-1 truncate bg-green-100 text-green-800 text-xs rounded flex items-center justify-center cursor-pointer select-none"
                        style={{
                          top: `${0.2 + (TASK_HEIGHT_REM * (index + 1))}rem`,
                          height: "1.25rem",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                        }}
                      >
                        {isSameDay(date, new Date(task.startDate))
                          ? task.cropName
                          : date > new Date(task.startDate) && date <= new Date(task.endDate)
                            ? task.taskName
                            : ""}
                      </div>
                    ))}

                    {/* +N表示 */}
                    {todayTasks.length > MAX_TASKS_PER_DAY && (
                      <div
                        className="absolute left-0 right-0 mx-1 text-center text-xs text-gray-500 cursor-pointer select-none"
                        style={{
                          top: `${0.2 + (TASK_HEIGHT_REM * (MAX_TASKS_PER_DAY + 1))}rem`,
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
                {format(selectedDate, "yyyy年MM月dd日", { locale: ja })}の予定
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {getTasksForDate(selectedDate).map((task) => (
                <div
                  key={task.id}
                  className="p-2 rounded-lg border hover:bg-green-50 cursor-pointer"
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
              <DialogTitle>予定の詳細</DialogTitle>
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
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
