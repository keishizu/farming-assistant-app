"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, Trash2 } from "lucide-react";
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
  isSameDay,
} from "date-fns";
import { ja } from "date-fns/locale";
import Image from "next/image";
import { Record, RecordCalendarProps } from "@/types/calendar";
import { useToast } from "@/hooks/use-toast";
import { deleteFarmRecord } from "@/services/farm-storage";
import { EditRecordModal } from "./edit-record-modal";
import { FarmRecord } from "@/types/farm";
import { getCrops } from "@/services/crop-storage";

export function RecordCalendar({ records, onUpdate }: RecordCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const { toast } = useToast();

  const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end });

  const MAX_RECORDS_PER_DAY = 3;
  const RECORD_HEIGHT_REM = 1.5;

  const getRecordsForDate = (date: Date) => {
    return records.filter((record) => isSameDay(record.date, date));
  };

  const getCropColor = (cropName: string) => {
    const crops = getCrops();
    const crop = crops.find(c => c.name === cropName);
    return crop?.color.bg || "bg-gray-100";
  };

  const handleDeleteRecord = (record: Record) => {
    if (window.confirm("この作業実績を削除してもよろしいですか？")) {
      const success = deleteFarmRecord(record.id);
      if (success) {
        setSelectedRecord(null);
        if (onUpdate) {
          onUpdate(records.filter(r => r.id !== record.id));
        }
        const { dismiss } = toast({
          title: "削除しました",
          description: "作業実績を削除しました",
          duration: 5000,
          onClick: () => dismiss(),
        });
      }
    }
  };

  const handleUpdateRecord = (updatedRecord: Record) => {
    if (onUpdate) {
      onUpdate(records.map(record => 
        record.id === updatedRecord.id ? updatedRecord : record
      ));
    }
  };

  const convertToFarmRecord = (record: Record): FarmRecord => ({
    id: record.id,
    userId: "demo-user",
    date: format(record.date, "yyyy-MM-dd"),
    crop: record.cropName,
    task: record.taskName,
    memo: record.memo,
    photoUrl: record.photoUrl,
    createdAt: new Date().toISOString(),
  });

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

              {/* 帯表示 */}
              {dateRecords.slice(0, MAX_RECORDS_PER_DAY).map((record, index) => {
                const cropColor = getCropColor(record.cropName);
                return (
                  <div
                    key={record.id}
                    className={`calendar-bar record-bar ${cropColor}`}
                    style={{
                      top: `${2 + (index * 1.5)}rem`
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRecord(record);
                    }}
                  >
                    {record.taskName}
                  </div>
                );
              })}

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
                  {format(selectedRecord.date, "yyyy年MM月dd日", { locale: ja })}
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
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingRecord(selectedRecord);
                    setSelectedRecord(null);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  編集
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteRecord(selectedRecord)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  削除
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 編集モーダル */}
      {editingRecord && (
        <EditRecordModal
          isOpen={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          record={convertToFarmRecord(editingRecord)}
          onUpdate={(updatedFarmRecord) => {
            const updatedRecord: Record = {
              id: updatedFarmRecord.id,
              cropName: updatedFarmRecord.crop,
              taskName: updatedFarmRecord.task,
              date: new Date(updatedFarmRecord.date),
              memo: updatedFarmRecord.memo,
              photoUrl: updatedFarmRecord.photoUrl,
            };
            handleUpdateRecord(updatedRecord);
          }}
        />
      )}
    </div>
  );
}
