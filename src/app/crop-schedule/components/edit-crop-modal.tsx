import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CustomCrop, CropTask, TaskType, TASK_TYPES } from "@/types/crop";
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
      startDate: new Date(startDate),
      memo: memo || undefined,
      tasks: pendingTasks.sort((a, b) => a.daysFromStart - b.daysFromStart),
    };

    onUpdate(updatedCrop);
    onClose();
  };

  const handleAddTask = () => {
    const newTask: CropTask = {
      id: uuidv4(),
      daysFromStart: 0,
      label: "",
      taskType: "field",
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
            <Label htmlFor="startDate">栽培開始日</Label>
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
              <h3 className="text-lg font-semibold">作業工程</h3>
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
                        {TASK_TYPES.find(t => t.type === task.taskType)?.label}
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
        <Label>相対日数（定植日からの日数）</Label>
        <Input
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
        <Label>作業分類</Label>
        <Select
          value={taskType}
          onValueChange={(value: TaskType) => setTaskType(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TASK_TYPES.map(({ type, label }) => (
              <SelectItem key={type} value={type}>
                <span>{label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>作業日数</Label>
        <Input
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
        <Label>メモ</Label>
        <Textarea
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