"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Task } from "@/types/calendar";
import { useToast } from "@/hooks/use-toast";
import { getCrops, saveCrops } from "@/services/crop-storage";
import { CustomCrop } from "@/types/crop";
import { differenceInCalendarDays, startOfDay, format } from "date-fns";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onUpdate: (task: Task) => void;
}

export function EditTaskModal({ isOpen, onClose, task, onUpdate }: EditTaskModalProps) {
  const [taskName, setTaskName] = useState(task.taskName);
  const [startDate, setStartDate] = useState(startOfDay(new Date(task.startDate)));
  const [endDate, setEndDate] = useState(startOfDay(new Date(task.endDate)));
  const [memo, setMemo] = useState(task.memo || "");
  const { toast } = useToast();

  const handleSave = () => {
    if (!taskName) {
      const { dismiss } = toast({
        title: "エラー",
        description: "作業名を選択してください",
        variant: "destructive",
        duration: 5000,
        onClick: () => dismiss(),
      });
      return;
    }

    if (taskName.length > 5) {
      const { dismiss } = toast({
        title: "エラー",
        description: "作業名は5文字以内で入力してください",
        variant: "destructive",
        duration: 5000,
        onClick: () => dismiss(),
      });
      return;
    }

    // 日付を日本時間の日付文字列に変換
    const formatDate = (date: Date) => {
      return format(date, 'yyyy-MM-dd');
    };

    const updatedTask: Task = {
      ...task,
      taskName,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      memo: memo || undefined,
    };

    // 作物スケジュールも更新
    const crops = getCrops();
    const updatedCrops = crops.map((crop: CustomCrop) => {
      if (crop.name === task.cropName) {
        const updatedTasks = crop.tasks.map((t) => {
          if (t.id === task.id) {
            // 定植日からの相対日数を計算（タイムゾーンを考慮）
            const cropStartDate = startOfDay(new Date(crop.startDate));
            const newDaysFromStart = differenceInCalendarDays(startDate, cropStartDate);
            const newDuration = differenceInCalendarDays(endDate, startDate) + 1;

            return {
              ...t,
              taskType: taskName,
              memo: memo || undefined,
              daysFromStart: newDaysFromStart,
              duration: newDuration,
            };
          }
          return t;
        });
        return { ...crop, tasks: updatedTasks };
      }
      return crop;
    });
    saveCrops(updatedCrops);

    onUpdate(updatedTask);
    onClose();

    const { dismiss } = toast({
      title: "更新しました",
      description: "予定を更新しました",
      duration: 5000,
      onClick: () => dismiss(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>予定を編集</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taskName">作業名</Label>
            <Input
              id="taskName"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="作業名を入力してください（5文字以内）"
              maxLength={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">開始日</Label>
            <DatePicker
              date={startDate}
              onSelect={(date) => setStartDate(startOfDay(date))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">終了日</Label>
            <DatePicker
              date={endDate}
              onSelect={(date) => setEndDate(startOfDay(date))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo">メモ</Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="予定に関するメモを入力してください"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 