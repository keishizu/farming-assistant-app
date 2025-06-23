"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CustomCrop, CropTask, TaskType, CropColorOption } from "@/types/crop";
import { useState } from "react";
import { format, addDays } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CROP_COLOR_OPTIONS } from "@/types/crop";

interface EditCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  crop: CustomCrop;
  onUpdate: (crop: CustomCrop) => void;
}

export function EditCropModal({ isOpen, onClose, crop, onUpdate }: EditCropModalProps) {
  const [name, setName] = useState(crop.name);
  const [startDate, setStartDate] = useState(format(crop.startDate, "yyyy-MM-dd"));
  const [memo, setMemo] = useState(crop.memo || "");
  const [color, setColor] = useState<CropColorOption>(crop.color);
  const [editingTask, setEditingTask] = useState<CropTask | null>(null);
  const [pendingTasks, setPendingTasks] = useState<CropTask[]>(crop.tasks);

  const formatTaskDateRange = (task: CropTask) => {
    const start = addDays(new Date(startDate), task.daysFromStart);
    const end = addDays(new Date(startDate), task.daysFromStart + task.duration - 1);

    if (task.duration === 1) {
      return format(start, "M月d日");
    } else {
      return `${format(start, "M月d日")}〜${format(end, "M月d日")}`;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedCrop: CustomCrop = {
      ...crop,
      name,
      startDate: startDate,
      memo: memo || undefined,
      tasks: pendingTasks.sort((a, b) => a.daysFromStart - b.daysFromStart),
      color,
    };

    onUpdate(updatedCrop);
    onClose();
  };

  const handleAddTask = () => {
    const newTask: CropTask = {
      id: uuidv4(),
      daysFromStart: 0,
      taskType: "",
      duration: 1,
    };
    setEditingTask(newTask);
  };

  const handleEditTask = (task: CropTask) => {
    setEditingTask(task);
  };

  const handleSaveTask = (task: CropTask) => {
    const taskExists = pendingTasks.some(t => t.id === task.id);
    
    if (taskExists) {
      setPendingTasks(pendingTasks.map(t => t.id === task.id ? task : t));
    } else {
      setPendingTasks([...pendingTasks, task]);
    }
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    setPendingTasks(pendingTasks.filter(task => task.id !== taskId));
  };

  // モーダルが閉じられた時にフォームをリセット
  const handleClose = () => {
    setName(crop.name);
    setStartDate(format(crop.startDate, "yyyy-MM-dd"));
    setMemo(crop.memo || "");
    setColor(crop.color);
    setPendingTasks(crop.tasks);
    setEditingTask(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>作物を編集</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">作物名</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">イメージカラー</Label>
            <Select 
              value={color.bg} 
              onValueChange={(value: string) => {
                const selectedColor = CROP_COLOR_OPTIONS.find(opt => opt.bg === value);
                if (selectedColor) {
                  setColor(selectedColor);
                }
              }} 
              required
            >
              <SelectTrigger id="color">
                <SelectValue placeholder="色を選択してください" />
              </SelectTrigger>
              <SelectContent>
                {CROP_COLOR_OPTIONS.map((option) => (
                  <SelectItem key={option.bg} value={option.bg}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full ${option.bg}`} />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">定植日</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memo">メモ</Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">栽培工程</h3>
              <Button 
                type="button" 
                onClick={handleAddTask}
                disabled={!!editingTask}
              >
                工程を追加
              </Button>
            </div>

            {editingTask && (
              <TaskForm
                task={editingTask}
                onSave={handleSaveTask}
                onCancel={() => setEditingTask(null)}
              />
            )}

            <div className="space-y-2">
              {pendingTasks
                .sort((a, b) => a.daysFromStart - b.daysFromStart)
                .map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div>
                      <p className="font-medium">
                        {task.taskType}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatTaskDateRange(task)}
                      </p>
                      {task.memo && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.memo}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTask(task)}
                        disabled={!!editingTask}
                      >
                        編集
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={!!editingTask}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {!editingTask && (
            <div className="flex justify-end">
              <Button type="submit">保存</Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface TaskFormProps {
  task: CropTask;
  onSave: (task: CropTask) => void;
  onCancel: () => void;
}

function TaskForm({ task, onSave, onCancel }: TaskFormProps) {
  const [daysFromStart, setDaysFromStart] = useState(task.daysFromStart);
  const [taskType, setTaskType] = useState<TaskType>(task.taskType);
  const [duration, setDuration] = useState(task.duration || 1);
  const [memo, setMemo] = useState(task.memo || "");
  const [error, setError] = useState("");
  const [daysError, setDaysError] = useState("");
  const [daysInput, setDaysInput] = useState(task.daysFromStart === 0 ? "" : task.daysFromStart.toString());
  const [durationInput, setDurationInput] = useState(task.duration === 1 ? "" : task.duration.toString());

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 空文字列、マイナス記号、または数字のみを許可
    if (value === "" || value === "-" || /^-?\d*$/.test(value)) {
      setDaysInput(value);
      if (value === "" || value === "-") {
        setDaysFromStart(0);
      } else {
        setDaysFromStart(parseInt(value, 10));
      }
      setDaysError("");
    }
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 空文字列または数字のみを許可
    if (value === "" || /^\d*$/.test(value)) {
      setDurationInput(value);
      if (value === "") {
        setDuration(1);
      } else {
        const num = parseInt(value, 10);
        setDuration(Math.max(1, num));
      }
      setError("");
    }
  };

  const handleSave = () => {
    if (isNaN(daysFromStart)) {
      setDaysError("数値を入力してください");
      return;
    }
    if (duration < 1) {
      setError("作業日数は1日以上を入力してください");
      return;
    }
    setError("");
    setDaysError("");
    onSave({
      ...task,
      daysFromStart,
      taskType,
      duration,
      memo: memo || undefined,
    });
  };

  return (
    <div className="p-4 border rounded space-y-4">
      <div className="space-y-2">
        <Label htmlFor="daysFromStart">相対日数（定植日からの日数）</Label>
        <Input
          id="daysFromStart"
          type="text"
          value={daysInput}
          onChange={handleDaysChange}
          placeholder="0"
          className={daysError ? "border-red-500" : ""}
        />
        {daysError && <p className="text-sm text-red-500">{daysError}</p>}
        <p className="text-sm text-muted-foreground">
          定植日より前の作業は負の数で入力してください
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="taskType">作業名</Label>
        <Input
          id="taskType"
          type="text"
          value={taskType}
          onChange={(e) => setTaskType(e.target.value)}
          placeholder="作業名を入力してください"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="duration">作業日数</Label>
        <Input
          id="duration"
          type="text"
          value={durationInput}
          onChange={handleDurationChange}
          placeholder="1"
          className="w-24"
        />
        <p className="text-sm text-muted-foreground">
          作業にかかる日数を入力してください（1日以上）
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="taskMemo">メモ</Label>
        <Textarea
          id="taskMemo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="作業に関するメモを入力してください"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="button" onClick={handleSave}>
          保存
        </Button>
      </div>
    </div>
  );
} 