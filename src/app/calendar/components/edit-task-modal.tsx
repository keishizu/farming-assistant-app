"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Task } from "@/types/calendar";
import { useToast } from "@/hooks/use-toast";
import { CustomCrop } from "@/types/crop";
import { format, parseISO } from "date-fns";
import { getCustomCrops, saveCustomCrop } from "@/services/customCrop-service";
import { getSmartCrops, saveSmartCrops } from "@/services/smartCrop-service";
import { useAuth } from "@/hooks/useAuth";
import { getAuthenticatedClient } from "@/lib/supabase";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onUpdate: (task: Task) => void;
}

export function EditTaskModal({ isOpen, onClose, task, onUpdate }: EditTaskModalProps) {
  const [taskName, setTaskName] = useState(task.taskName);
  const [startDate, setStartDate] = useState<Date>(parseISO(task.startDate));
  const [endDate, setEndDate] = useState<Date | undefined>(
    task.endDate ? parseISO(task.endDate) : undefined
  );
  const [memo, setMemo] = useState(task.memo || "");
  const [cropNames, setCropNames] = useState<string[]>([]);
  const { toast } = useToast();
  const { user, getToken, loading } = useAuth();
  const userId = user?.id;
  const isLoaded = !loading;
  const supabase = getAuthenticatedClient();

  useEffect(() => {
    const fetchCropNames = async () => {
      if (!isLoaded || !userId || !supabase) return;
      const token = await getToken({ template: "supabase" });
      if (!token) return;

      try {
        const [customCrops, smartCrops] = await Promise.all([
          getCustomCrops(supabase, userId, token),
          getSmartCrops(supabase, userId),
        ]);

        const allCrops = [...customCrops, ...smartCrops];
        const names = Array.from(new Set(allCrops.map((crop) => crop.name)));
        setCropNames(names);
      } catch (error) {
        console.error("Failed to fetch crop names:", error);
        toast({
          title: "エラー",
          description: "作物名の取得に失敗しました",
          variant: "destructive",
        });
      }
    };

    fetchCropNames();
  }, [isLoaded, userId, getToken, toast, supabase]);

  const handleSave = async () => {
    if (!isLoaded || !userId || !supabase) {
      toast({
        title: "エラー",
        description: "認証が必要です",
        variant: "destructive",
      });
      return;
    }

    const token = await getToken({ template: "supabase" });
    if (!token) {
      toast({
        title: "エラー",
        description: "認証トークンの取得に失敗しました",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedTask: Task = {
        ...task,
        taskName,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : task.endDate,
        memo: memo || undefined,
      };

      const [customCrops, smartCrops] = await Promise.all([
        getCustomCrops(supabase, userId, token),
        getSmartCrops(supabase, userId),
      ]);

      const allCrops = [...customCrops, ...smartCrops];
      const crop = allCrops.find((c) => c.name === task.cropName);

      if (crop) {
        const updatedCrop: CustomCrop = {
          ...crop,
          tasks: crop.tasks.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  name: taskName,
                  startDate: format(startDate, "yyyy-MM-dd"),
                  endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
                  memo: memo || undefined,
                }
              : t
          ),
        };

        if (customCrops.some((c) => c.id === crop.id)) {
          await saveCustomCrop(supabase, userId, [updatedCrop]);
        } else {
          const updatedSmartCrops = smartCrops.map((c) =>
            c.id === crop.id ? updatedCrop : c
          );
          await saveSmartCrops(supabase, userId, updatedSmartCrops);
        }
      }

      onUpdate(updatedTask);
      onClose();

      toast({
        title: "更新しました",
        description: "作業を更新しました",
      });
    } catch (error) {
      console.error("Failed to update task:", error);
      toast({
        title: "エラー",
        description: "作業の更新に失敗しました",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>作業を編集</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cropName">作物名</Label>
            <Input id="cropName" value={task.cropName} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taskName">作業名</Label>
            <Input
              id="taskName"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="作業名を入力してください"
            />
          </div>

          <div className="space-y-2">
            <Label>開始日</Label>
            <DatePicker date={startDate} onSelect={setStartDate} />
          </div>

          <div className="space-y-2">
            <Label>終了日</Label>
            <DatePicker date={endDate || new Date()} onSelect={setEndDate} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo">メモ</Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="メモを入力してください"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
