"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  subYears,
  addYears,
  eachDayOfInterval,
  isToday,
  format,
  isSameMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ja } from "date-fns/locale";
import Image from "next/image";
import { Record, RecordCalendarProps } from "@/types/calendar";

export function RecordCalendar({ records }: RecordCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);

  const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end });

  const MAX_RECORDS_PER_DAY = 1;
  const RECORD_HEIGHT_REM = 1.5;

  const getRecordsForDate = (date: Date) => {
    return records.filter((record) => {
      const recordDate = new Date(record.date);
      return (
        recordDate.getFullYear() === date.getFullYear() &&
        recordDate.getMonth() === date.getMonth() &&
        recordDate.getDate() === date.getDate()
      );
    });
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

      {/* 曜日ヘッダー */}
      <div className="calendar-grid relative">
        {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
          <div key={day} className="calendar-header">
            {day}
          </div>
        ))}

        {/* 日付セル */}
        {days.map((date) => {
          const dateRecords = getRecordsForDate(date);

          return (
            <div
              key={date.toISOString()}
              className={`calendar-cell min-h-[100px] relative ${
                isToday(date) ? "today" : ""
              } ${!isSameMonth(date, currentDate) ? "other-month" : ""}`}
              onClick={() => dateRecords.length > 0 && setSelectedDate(date)}
            >
              <div className="calendar-date relative">{format(date, "d")}</div>

              {/* 帯表示（作物名のみ） */}
              {dateRecords.slice(0, MAX_RECORDS_PER_DAY).map((record, index) => (
                <div
                  key={record.id}
                  className="record-bar absolute left-0 right-0 mx-1 px-1 truncate bg-blue-100 text-blue-800 text-xs rounded flex items-center justify-center cursor-pointer select-none"
                  style={{
                    top: `${0.3 + (RECORD_HEIGHT_REM * (index + 1))}rem`,
                    height: "1.25rem",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRecord(record);
                  }}
                >
                  {record.cropName}
                </div>
              ))}

              {/* +N表示 */}
              {dateRecords.length > MAX_RECORDS_PER_DAY && (
                <div
                  className="absolute left-0 right-0 mx-1 text-center text-xs text-gray-500 cursor-pointer select-none"
                  style={{
                    top: `${0.3 + (RECORD_HEIGHT_REM * (MAX_RECORDS_PER_DAY + 1))}rem`,
                  }}
                >
                  +{dateRecords.length - MAX_RECORDS_PER_DAY}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 実績一覧モーダル */}
      {selectedDate && (
        <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {format(selectedDate, "yyyy年MM月dd日", { locale: ja })}の実績
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {getRecordsForDate(selectedDate).map((record) => (
                <div
                  key={record.id}
                  className="p-2 rounded-lg border hover:bg-blue-50 cursor-pointer"
                  onClick={() => {
                    setSelectedRecord(record);
                    setSelectedDate(null);
                  }}
                >
                  <div className="font-medium">{record.cropName}</div>
                  <div className="text-sm text-gray-600">{record.taskName}</div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 実績詳細モーダル */}
      {selectedRecord && (
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>作業詳細</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="font-medium">作物名</div>
                <div>{selectedRecord.cropName}</div>
              </div>
              <div>
                <div className="font-medium">作業名</div>
                <div>{selectedRecord.taskName}</div>
              </div>
              <div>
                <div className="font-medium">作業日</div>
                <div>
                  {format(new Date(selectedRecord.date), "yyyy年MM月dd日", { locale: ja })}
                </div>
              </div>
              {selectedRecord.memo && (
                <div>
                  <div className="font-medium">メモ</div>
                  <div className="whitespace-pre-wrap">{selectedRecord.memo}</div>
                </div>
              )}
              {selectedRecord.photoUrl && (
                <div>
                  <div className="font-medium">写真</div>
                  <div className="relative w-full h-48">
                    <Image src={selectedRecord.photoUrl} alt="作業写真" fill className="object-cover rounded-lg" />
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
