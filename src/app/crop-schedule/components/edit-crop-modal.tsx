import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CustomCrop, CropTask, TaskStage, TaskType } from "@/lib/types/crop";
import { useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
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

const TASK_STAGES: TaskStage[] = [
  "畑の準備①",
  "畑の準備②",
  "畑の準備③",
  "播種",
  "定植",
  "初期管理①",
  "初期管理②",
  "中期管理①",
  "中期管理②",
  "後期管理",
  "収穫",
];

const TASK_TYPES: TaskType[] = ["field", "planting", "care", "harvest"];

export function EditCropModal({ isOpen, onClose, crop, onUpdate }: EditCropModalProps) {
  const [name, setName] = useState(crop.name);
  const [startDate, setStartDate] = useState(format(crop.startDate, "yyyy-MM-dd"));
  const [memo, setMemo] = useState(crop.memo || "");
  const [tasks, setTasks] = useState<CropTask[]>(crop.tasks);
  const [editingTask, setEditingTask] = useState<CropTask | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedCrop: CustomCrop = {
      ...crop,
      name,
      startDate: new Date(startDate),
      memo: memo || undefined,
      tasks: tasks.sort((a, b) => a.daysFromStart - b.daysFromStart),
    };

    onUpdate(updatedCrop);
    onClose();
  };

  const handleAddTask = () => {
    const newTask: CropTask = {
      id: uuidv4(),
      daysFromStart: 0,
      stage: "畑の準備①",
      label: "",
      uiText: "",
    };
    setEditingTask(newTask);
  };

  const handleEditTask = (task: CropTask) => {
    setEditingTask(task);
  };

  const handleSaveTask = (task: CropTask) => {
    const taskExists = tasks.some(t => t.id === task.id);
    
    if (taskExists) {
      // 既存のタスクを更新
      const updatedTasks = tasks.map(t => 
        t.id === task.id ? task : t
      );
      setTasks(updatedTasks);
    } else {
      // 新しいタスクを追加
      setTasks([...tasks, task]);
    }
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <p className="font-medium">{task.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.stage} (開始から{task.daysFromStart}日目)
                    </p>
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

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit">保存</Button>
          </div>
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
  const [stage, setStage] = useState<TaskStage>(task.stage);
  const [label, setLabel] = useState(task.label);
  const [uiText, setUiText] = useState(task.uiText);
  const [taskType, setTaskType] = useState<TaskType | undefined>(task.taskType);

  const handleSave = () => {
    onSave({
      ...task,
      daysFromStart,
      stage,
      label,
      uiText,
      taskType,
    });
  };

  return (
    <div className="p-4 border rounded space-y-4">
      <div className="space-y-2">
        <Label>相対日数</Label>
        <Input
          type="number"
          value={daysFromStart}
          onChange={(e) => setDaysFromStart(Number(e.target.value))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>ステージ</Label>
        <Select value={stage} onValueChange={(value: TaskStage) => setStage(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TASK_STAGES.map(stage => (
              <SelectItem key={stage} value={stage}>
                {stage}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>作業名</Label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>UI表示文</Label>
        <Input
          value={uiText}
          onChange={(e) => setUiText(e.target.value)}
          required
        />
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
            {TASK_TYPES.map(type => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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