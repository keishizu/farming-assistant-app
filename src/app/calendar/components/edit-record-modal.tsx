"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateFarmRecord } from "@/services/farmRecord-service";
import { FarmRecord } from "@/types/farm";
import { getCustomCrops } from "@/services/customCrop-service";
import { getSmartCrops } from "@/services/smartCrop-service";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { useAuth } from "@clerk/nextjs";
import { useSupabaseWithAuth } from "@/lib/supabase";

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FarmRecord;
  onUpdate: (record: FarmRecord) => void;
}

export function EditRecordModal({
  isOpen,
  onClose,
  record,
  onUpdate,
}: EditRecordModalProps) {
  const { userId, getToken } = useAuth();
  const supabase = useSupabaseWithAuth();
  const [cropName, setCropName] = useState(record.crop);
  const [taskName, setTaskName] = useState(record.task);
  const [memo, setMemo] = useState(record.memo || "");
  const [photoUrl, setPhotoUrl] = useState(record.photoUrl || "");
  const [cropNames, setCropNames] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCropNames = async () => {
      if (!userId || !supabase) return;
      try {
        const token = await getToken({ template: "supabase" });
        if (!token) {
          throw new Error("認証トークンの取得に失敗しました");
        }
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
  }, [userId, supabase, getToken, toast]);

  const handleSave = async () => {
    if (!userId || !supabase) return;

    try {
      const token = await getToken({ template: "supabase" });
      if (!token) {
        throw new Error("認証トークンの取得に失敗しました");
      }

      const updatedRecord: FarmRecord = {
        ...record,
        crop: cropName,
        task: taskName,
        memo: memo || undefined,
        photoUrl: photoUrl || undefined,
      };

      await updateFarmRecord(
        supabase,
        userId,
        token,
        record.id,
        {
          crop: cropName,
          task: taskName,
          memo: memo || undefined,
          photoUrl: photoUrl || undefined,
        }
      );

      await onUpdate(updatedRecord);
      onClose();

      toast({
        title: "更新しました",
        description: "記録を更新しました",
      });
    } catch (error) {
      console.error("Failed to update record:", error);
      toast({
        title: "エラー",
        description: "記録の更新に失敗しました",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>記録を編集</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cropName">作物名</Label>
            <Select value={cropName} onValueChange={setCropName}>
              <SelectTrigger>
                <SelectValue placeholder="作物を選択" />
              </SelectTrigger>
              <SelectContent>
                {cropNames.length === 0 ? (
                  <SelectItem value="" disabled>
                    作物がありません
                  </SelectItem>
                ) : (
                  cropNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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
            <Label htmlFor="memo">メモ</Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="メモを入力してください"
            />
          </div>

          {photoUrl && (
            <div className="space-y-2">
              <Label>写真</Label>
              <div className="relative w-full h-48">
                <Image
                  src={photoUrl}
                  alt="記録の写真"
                  fill
                  className="object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => setPhotoUrl("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

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
