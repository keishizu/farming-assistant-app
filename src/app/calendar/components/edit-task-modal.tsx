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


interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onUpdate: (task: Task) => void;
}

export function EditTaskModal({ isOpen, onClose, task, onUpdate }: EditTaskModalProps) {
  const [taskName, setTaskName] = useState(task.taskName);
  const [startDate, setStartDate] = useState(new Date(task.startDate));
  const [endDate, setEndDate] = useState(new Date(task.endDate));
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

    const updatedTask: Task = {
      ...task,
      taskName,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      memo: memo || undefined,
    };

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
              onSelect={setStartDate}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">終了日</Label>
            <DatePicker
              date={endDate}
              onSelect={setEndDate}
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