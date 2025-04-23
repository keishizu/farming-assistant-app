"use client";

import { format, isWithinInterval, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import CustomCalendar from "@/app/calendar/components/CustomCalendar";
import "react-calendar/dist/Calendar.css";
import "@/app/calendar/calendar.css";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { TaskDisplayRange, WorkRecord } from "@/types/calendar";

const formatDay = (locale: string | undefined, date: Date): string => {
  return date.getDate().toString(); // "6日" ではなく "6" にする
};

const formatMonthYear = (locale: string | undefined, date: Date): string => {
  return format(date, "yyyy年M月", { locale: ja });
};

const formatShortWeekday = (locale: string | undefined, date: Date): string => {
  return format(date, "E", { locale: ja });
};

export default function CalendarScreen() {
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<TaskDisplayRange[]>([]);
  const [workRecords, setWorkRecords] = useState<WorkRecord[]>([]);

  useEffect(() => {
    setMounted(true);
    // TODO: 実データ取得処理
  }, []);

  const isDateInTaskRange = (date: Date, task: TaskDisplayRange) => {
    const startDate = parseISO(task.startDate);
    const endDate = parseISO(task.endDate);
    return isWithinInterval(date, { start: startDate, end: endDate });
  };

  const getWorkRecordsForDate = (date: Date) => {
    return workRecords.filter(record => {
      const recordDate = parseISO(record.createdAt);
      return format(recordDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
    });
  };

  if (!mounted) return null;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-semibold text-green-800">農作業カレンダー</h1>
        <p className="text-gray-600">予定と実績を確認</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 予定カレンダー */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4 text-center text-green-800">予定カレンダー</h2>
          <CustomCalendar
            className="w-full"
            locale="ja"
            calendarType="gregory"
            formatMonthYear={formatMonthYear}
            formatShortWeekday={formatShortWeekday}
            formatDay={formatDay}
            tileContent={({ date }) => {
              const dayTasks = tasks.filter(task => isDateInTaskRange(date, task));
              if (dayTasks.length === 0) return null;

              return (
                <div className="mt-1">
                  {dayTasks.map(task => (
                    <div
                      key={task.id}
                      className="text-xs bg-green-100 text-green-800 rounded px-1 py-0.5 mb-1 truncate"
                    >
                      {task.cropName}: {task.taskName}
                    </div>
                  ))}
                </div>
              );
            }}
          />
        </Card>

        {/* 実績カレンダー */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4 text-center text-blue-800">実績カレンダー</h2>
          <CustomCalendar
            className="w-full"
            locale="ja"
            calendarType="gregory"
            formatMonthYear={formatMonthYear}
            formatShortWeekday={formatShortWeekday}
            formatDay={formatDay}
            tileContent={({ date }) => {
              const dayRecords = getWorkRecordsForDate(date);
              if (dayRecords.length === 0) return null;

              return (
                <div className="mt-1">
                  {dayRecords.map(record => (
                    <div
                      key={record.id}
                      className="text-xs bg-blue-100 text-blue-800 rounded px-1 py-0.5 mb-1 truncate"
                    >
                      {record.crop}: {record.task}
                      {record.memo && (
                        <span className="block text-gray-600 text-[10px] mt-1">
                          {record.memo}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              );
            }}
          />
        </Card>
      </div>
    </div>
  );
}
