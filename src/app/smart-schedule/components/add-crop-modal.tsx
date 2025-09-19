"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CustomCrop, CropTask, TaskType, CropColorOption } from "@/types/crop";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { format, addDays } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CROP_COLOR_OPTIONS } from "@/types/crop";
import { AVAILABLE_CROPS, DefaultCrop } from "@/types/default-crops";
import { saveSmartCrops } from "@/services/smartCrop-service";
import { useAuth } from "@/hooks/useAuth";
import { getAuthenticatedClient } from "@/lib/supabase";
import { cropBasicInfo } from "@/types/cropDescriptions";

// 作物オブジェクトの生成を分離したユーティリティ関数
const createCustomCrop = (
  selectedCrop: DefaultCrop,
  startDate: string,
  memo: string,
  color: CropColorOption,
  tasks: CropTask[]
): CustomCrop => {
  return {
    id: uuidv4(),
    name: selectedCrop.name,
    startDate: startDate,
    memo: memo.trim() || undefined,
    tasks: tasks.sort((a, b) => a.daysFromStart - b.daysFromStart),
    color: {
      text: color.text,
      bg: color.bg,
      label: color.label,
    },
  };
};

interface AddCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (crop: CustomCrop) => void;
}

export function AddCropModal({ isOpen, onClose, onAdd }: AddCropModalProps) {
  const { session } = useAuth();
  const supabase = getAuthenticatedClient();
  const [selectedCrop, setSelectedCrop] = useState<DefaultCrop | null>(null);
  const [startDate, setStartDate] = useState("");
  const [memo, setMemo] = useState("");
  const [userEditedMemo, setUserEditedMemo] = useState(false);
  const [color, setColor] = useState<CropColorOption>(CROP_COLOR_OPTIONS[0]);
  const [editingTask, setEditingTask] = useState<CropTask | null>(null);
  const [pendingTasks, setPendingTasks] = useState<CropTask[]>([]);
  const { toast } = useToast();

  // モーダルが開かれた時にフォームをリセット
  useEffect(() => {
    if (isOpen) {
      setSelectedCrop(null);
      setStartDate("");
      setMemo("");
      setUserEditedMemo(false);
      setColor(CROP_COLOR_OPTIONS[0]);
      setPendingTasks([]);
      setEditingTask(null);
    }
  }, [isOpen]);

  if (!supabase) {
    return null;
  }

  const handleCropSelect = (cropId: string) => {
    const crop = AVAILABLE_CROPS.find(c => c.id === cropId);
    if (crop) {
      setSelectedCrop(crop);
      setPendingTasks(crop.tasks);
      // 作物が変更されたら、ユーザー編集フラグをリセット
      setUserEditedMemo(false);
    }
  };

  const formatTaskDateRange = (task: CropTask) => {
    if (!startDate) return "";
    const start = addDays(new Date(startDate), task.daysFromStart);
    const end = addDays(new Date(startDate), task.daysFromStart + task.duration - 1);

    if (task.duration === 1) {
      return format(start, "M月d日");
    } else {
      return `${format(start, "M月d日")}〜${format(end, "M月d日")}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id) {
      toast({
        title: "認証エラー",
        description: "ユーザー情報が取得できません。ログインしてください。",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCrop) {
      toast({
        title: "エラー",
        description: "作物を選択してください",
        variant: "destructive",
      });
      return;
    }

    if (!startDate) {
      toast({
        title: "エラー",
        description: "定植日を選択してください",
        variant: "destructive",
      });
      return;
    }

    try {
      const newCrop = createCustomCrop(
        selectedCrop,
        startDate,
        memo,
        color,
        pendingTasks
      );

      await saveSmartCrops(supabase, session.user.id, [newCrop]);
      onAdd(newCrop);
      onClose();

      // フォームをリセット
      setSelectedCrop(null);
      setStartDate("");
      setMemo("");
      setUserEditedMemo(false);
      setColor(CROP_COLOR_OPTIONS[0]);
      setPendingTasks([]);
      setEditingTask(null);

      // 成功メッセージを表示
      toast({
        title: "追加しました",
        description: "新しい作物を追加しました",
      });
    } catch (error) {
      console.error("Failed to save crop:", error);
      toast({
        title: "エラー",
        description: "作物の保存に失敗しました",
        variant: "destructive",
      });
    }
  };

  // 作業工程のデフォルト入力項目
  const handleAddTask = () => {
    const newTask: CropTask = {
      id: uuidv4(),
      daysFromStart: 0,
      taskType: "",
      duration: 1,
    };
    setEditingTask(newTask);
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

  // textarea 変更時に userEditedMemo を true に
  const handleMemoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserEditedMemo(true);
    setMemo(e.target.value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新しい作物を追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="crop">作物</Label>
            <Select onValueChange={handleCropSelect}>
              <SelectTrigger>
                <SelectValue placeholder="作物を選択" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_CROPS.map((crop) => (
                  <SelectItem key={crop.id} value={crop.id}>
                    {crop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 作物基本情報 */}
          {selectedCrop && cropBasicInfo[selectedCrop.name] && (
            <div className="space-y-2">
              <Label>作物の基本情報</Label>
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">難易度</p>
                  <p className="text-sm text-gray-600">{cropBasicInfo[selectedCrop.name].difficulty}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">植え付け適期</p>
                  <p className="text-sm text-gray-600">{cropBasicInfo[selectedCrop.name].plantingSeason}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">収穫時期</p>
                  <p className="text-sm text-gray-600">{cropBasicInfo[selectedCrop.name].harvestSeason}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">栽培期間</p>
                  <p className="text-sm text-gray-600">{cropBasicInfo[selectedCrop.name].growingPeriod}</p>
                </div>
              </div>
              
              {/* アドバイス */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-700 mb-2">アドバイス</p>
                <p className="text-sm text-blue-600 whitespace-pre-wrap">
                  {cropBasicInfo[selectedCrop.name].advice}
                </p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="color">イメージカラー</Label>
            <Select value={color.bg} onValueChange={(value) => {
              const selectedColor = CROP_COLOR_OPTIONS.find(opt => opt.bg === value);
              if (selectedColor) {
                setColor(selectedColor);
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="カラーを選択" />
              </SelectTrigger>
              <SelectContent>
                {CROP_COLOR_OPTIONS.map((option) => (
                  <SelectItem key={option.bg} value={option.bg}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${option.bg}`} />
                      {option.label}
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memo">メモ</Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={handleMemoChange}
              placeholder="メモがあれば入力してください"
              rows={8}
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
                        onClick={() => setEditingTask(task)}
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
              <Button type="submit">追加</Button>
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
        <Label>作業名</Label>
        <Input
          type="text"
          value={taskType}
          onChange={(e) => setTaskType(e.target.value)}
          placeholder="作業名を入力してください 例：定植"
        />
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