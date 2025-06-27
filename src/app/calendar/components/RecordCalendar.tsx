"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  Trash2,
  X,
} from "lucide-react";
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
} from "date-fns";
import { ja } from "date-fns/locale";
import Image from "next/image";
import { FarmRecord } from "@/types/farm";
import { EditRecordModal } from "./edit-record-modal";
import { useToast } from "@/hooks/use-toast";
import { getCustomCrops } from "@/services/customCrop-service";
import { getSmartCrops } from "@/services/smartCrop-service";
import { deleteFarmRecord } from "@/services/farmRecord-service";
import { CustomCrop } from "@/types/crop";
import { useAuth } from "@clerk/nextjs";
import { useSupabaseWithAuth } from "@/lib/supabase";
import { getSignedImageUrl } from "@/services/upload-image";

interface RecordCalendarProps {
  records: FarmRecord[];
  onUpdate?: (records: FarmRecord[]) => void;
}

export function RecordCalendar({ records, onUpdate }: RecordCalendarProps) {
  const { userId, isLoaded, getToken } = useAuth();
  const supabase = useSupabaseWithAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<FarmRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<FarmRecord | null>(null);
  const { toast } = useToast();
  const [customCrops, setCustomCrops] = useState<CustomCrop[]>([]);
  const [smartCrops, setSmartCrops] = useState<CustomCrop[]>([]);
  const [cropColors, setCropColors] = useState<Record<string, string>>({});
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [crops, setCrops] = useState<any[]>([]);
  const [expandedImage, setExpandedImage] = useState<{ url: string; alt: string } | null>(null);

  useEffect(() => {
    const fetchCrops = async () => {
      if (!isLoaded || !userId || !supabase) return;

      try {
        const token = await getToken({ template: "supabase" });
        if (!token) {
          throw new Error("認証トークンの取得に失敗しました");
        }
        const [customCropsData, smartCropsData] = await Promise.all([
          getCustomCrops(supabase, userId, token),
          getSmartCrops(supabase, userId),
        ]);
        setCustomCrops(customCropsData);
        setSmartCrops(smartCropsData);
      } catch (error) {
        console.error("Failed to fetch crops:", error);
        toast({
          title: "エラー",
          description: "作物データの取得に失敗しました",
          variant: "destructive",
        });
      }
    };

    fetchCrops();
  }, [userId, isLoaded, supabase, getToken, toast]);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 }),
  });

  const MAX_RECORDS_PER_DAY = 1;
  const RECORD_HEIGHT_REM = 1.5;

  const getRecordsForDate = (date: Date) => {
    return records.filter(
      (record) =>
        format(new Date(record.date), "yyyy-MM-dd") ===
        format(date, "yyyy-MM-dd")
    );
  };

  const getCropColor = (cropId: string) => {
    const allCrops = [...customCrops, ...smartCrops];
    const crop = allCrops.find((c) => c.id === cropId);
    return crop?.color.bg || "bg-gray-100";
  };

  const handleUpdateRecord = (updatedRecord: FarmRecord) => {
    if (onUpdate) {
      const updatedRecords = records.map((record) =>
        record.id === updatedRecord.id ? updatedRecord : record
      );
      onUpdate(updatedRecords);
    }
    setEditingRecord(null);
    toast({
      title: "更新しました",
      description: "作業実績を更新しました",
    });
  };

  const handleDeleteRecord = async (record: FarmRecord) => {
    if (!userId || !supabase) {
      toast({
        title: "エラー",
        description: "認証情報が不足しています",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm("この記録を削除してもよろしいですか？")) {
      try {
        await deleteFarmRecord(supabase, userId, record.id);
        setSelectedRecord(null);
        if (onUpdate) {
          onUpdate(records.filter((r) => r.id !== record.id));
        }
        
        // 画像があった場合は削除完了を通知
        if (record.photoPath) {
          toast({
            title: "削除しました",
            description: "作業実績と画像を削除しました",
          });
        } else {
          toast({
            title: "削除しました",
            description: "作業実績を削除しました",
          });
        }
      } catch (error) {
        console.error("Failed to delete record:", error);
        toast({
          title: "エラー",
          description: "記録の削除に失敗しました",
          variant: "destructive",
        });
      }
    }
  };

  // 画像URLを取得する関数
  const getImageUrl = async (photoPath: string) => {
    if (!supabase) return "";
    
    try {
      const url = await getSignedImageUrl(supabase, photoPath);
      setImageUrls(prev => ({ ...prev, [photoPath]: url }));
      return url;
    } catch (error) {
      console.error("Failed to get signed URL:", error);
      
      // 署名付きURLの有効期限切れエラーの場合
      if (error instanceof Error && error.message === "SIGNED_URL_EXPIRED") {
        console.warn("Signed URL expired, image may need to be re-uploaded:", photoPath);
      }
      
      return "";
    }
  };

  // 選択されたレコードの画像URLを取得
  useEffect(() => {
    if (selectedRecord?.photoPath && !imageUrls[selectedRecord.photoPath]) {
      getImageUrl(selectedRecord.photoPath);
    }
  }, [selectedRecord, imageUrls]);

  return (
    <div className="w-full">
      {/* カレンダーのヘッダーとナビゲーション */}
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

      {/* カレンダーグリッド */}
      <div className="calendar-grid relative">
        {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
          <div key={day} className="calendar-header">
            {day}
          </div>
        ))}
        {days.map((date) => {
          const todayRecords = getRecordsForDate(date);
          return (
            <div
              key={date.toISOString()}
              className={`calendar-cell min-h-[100px] relative ${isToday(date) ? "today" : ""} ${
                !isSameMonth(date, currentDate) ? "other-month" : ""
              }`}
              onClick={() => todayRecords.length > 0 && setSelectedDate(date)}
            >
              <div className="calendar-date relative">{format(date, "d")}</div>
              {todayRecords.slice(0, MAX_RECORDS_PER_DAY).map((record, index) => (
                <div
                  key={record.id}
                  className={`calendar-bar record-bar ${getCropColor(record.cropId)}`}
                  style={{
                    top: `${0.2 + RECORD_HEIGHT_REM * (index + 1)}rem`,
                    height: "1.25rem",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRecord(record);
                  }}
                >
                  {record.task}
                </div>
              ))}
              {todayRecords.length > MAX_RECORDS_PER_DAY && (
                <div
                  className="absolute left-0 right-0 mx-1 text-center text-xs text-gray-500 cursor-pointer select-none"
                  style={{
                    top: `${2 + RECORD_HEIGHT_REM * (MAX_RECORDS_PER_DAY + 1)}rem`,
                  }}
                >
                  +{todayRecords.length - MAX_RECORDS_PER_DAY}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* モーダルたち */}
      {selectedDate && (
        <Dialog open={Boolean(selectedDate)} onOpenChange={() => setSelectedDate(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {format(selectedDate, "yyyy年MM月dd日", { locale: ja })}の記録
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {getRecordsForDate(selectedDate).map((record) => (
                <div
                  key={record.id}
                  className="p-2 rounded-lg border hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedRecord(record);
                    setSelectedDate(null);
                  }}
                >
                  <div className="font-medium">{record.crop}</div>
                  <div className="text-sm text-gray-600">{record.task}</div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedRecord && (
        <Dialog open={Boolean(selectedRecord)} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>記録の詳細</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><div className="font-medium">作物名</div><div>{selectedRecord.crop}</div></div>
              <div><div className="font-medium">作業名</div><div>{selectedRecord.task}</div></div>
              <div>
                <div className="font-medium">日付</div>
                <div>{format(new Date(selectedRecord.date), "yyyy年MM月dd日", { locale: ja })}</div>
              </div>
              {selectedRecord.memo && (
                <div>
                  <div className="font-medium">メモ</div>
                  <div className="whitespace-pre-wrap">{selectedRecord.memo}</div>
                </div>
              )}
              {selectedRecord.photoPath && (
                <div>
                  <div className="font-medium">写真</div>
                  {imageUrls[selectedRecord.photoPath] ? (
                    <div className="relative w-full h-48 mt-2 cursor-pointer" 
                         onClick={() => selectedRecord.photoPath && setExpandedImage({
                           url: imageUrls[selectedRecord.photoPath],
                           alt: "記録の写真"
                         })}>
                      <Image
                        src={imageUrls[selectedRecord.photoPath]}
                        alt="記録の写真"
                        fill
                        className="object-cover rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 mt-2 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <p className="text-sm">画像を読み込み中...</p>
                      </div>
                    </div>
                  )}
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

      {editingRecord && (
        <EditRecordModal
          isOpen={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          record={editingRecord}
          onUpdate={handleUpdateRecord}
        />
      )}

      {/* 画像拡大表示モーダル */}
      {expandedImage && (
        <Dialog open={Boolean(expandedImage)} onOpenChange={() => setExpandedImage(null)}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-transparent border-none shadow-none">
            <div className="relative w-full h-full">
              <Button
                variant="outline"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white border-white/20"
                onClick={() => setExpandedImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="w-full h-full flex items-center justify-center">
                <Image
                  src={expandedImage.url}
                  alt={expandedImage.alt}
                  width={800}
                  height={600}
                  className="max-w-full max-h-full object-contain"
                  sizes="(max-width: 768px) 90vw, (max-width: 1200px) 80vw, 70vw"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
