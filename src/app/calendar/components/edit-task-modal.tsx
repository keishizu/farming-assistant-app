"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Task } from "@/types/calendar";
import { TASK_TYPES, TaskType } from "@/types/crop";
import { DatePicker } from "@/components/ui/date-picker";
import { addDays, format } from "date-fns";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onUpdate: (task: Task) => void;
}

const tasks = TASK_TYPES.map((task) => task.label);

export function EditTaskModal({ isOpen, onClose, task, onUpdate }: EditTaskModalProps) {
  const [taskName, setTaskName] = useState(task.taskName);
  const [taskType, setTaskType] = useState(task.taskType);
  const [startDate, setStartDate] = useState(new Date(task.startDate));
  const [endDate, setEndDate] = useState(new Date(task.endDate));
  const [memo, setMemo] = useState(task.memo || "");
  const { toast } = useToast();

  const handleSave = () => {
    if (!taskName || !taskType) {
      const { dismiss } = toast({
        title: "エラー",
        description: "作業名と作業タイプを選択してください",
        variant: "destructive",
        duration: 5000,
        onClick: () => dismiss(),
      });
      return;
    }

    const updatedTask: Task = {
      ...task,
      taskName,
      taskType,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
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
            <Select value={taskName} onValueChange={setTaskName}>
              <SelectTrigger id="taskName" className="w-full">
                <SelectValue placeholder="作業を選んでください" />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((task) => (
                  <SelectItem key={task} value={task}>
                    {task}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taskType">作業タイプ</Label>
            <Select value={taskType} onValueChange={(value: TaskType) => setTaskType(value)}>
              <SelectTrigger id="taskType" className="w-full">
                <SelectValue placeholder="作業タイプを選んでください" />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((type) => (
                  <SelectItem key={type.type} value={type.type}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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