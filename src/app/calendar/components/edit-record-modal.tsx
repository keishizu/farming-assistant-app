"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateFarmRecord } from "@/services/farm-storage";
import { FarmRecord } from "@/types/farm";
import { getCropNames, getCrops } from "@/services/crop-storage";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { CustomCrop } from "@/types/crop";

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FarmRecord;
  onUpdate: (record: FarmRecord) => void;
}

export function EditRecordModal({ isOpen, onClose, record, onUpdate }: EditRecordModalProps) {
  const [crop, setCrop] = useState(record.crop);
  const [task, setTask] = useState(record.task);
  const [memo, setMemo] = useState(record.memo || "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(record.photoUrl || null);
  const [cropNames, setCropNames] = useState<string[]>([]);
  const [availableTaskTypes, setAvailableTaskTypes] = useState<string[]>([]);
  const { toast } = useToast();

  // 作物名の選択肢を取得
  useEffect(() => {
    if (isOpen) {
      setCropNames(getCropNames());
    }
  }, [isOpen]);

  // 選択された作物に紐づく作業名を取得
  useEffect(() => {
    if (isOpen && crop) {
      const crops = getCrops();
      const selectedCrop = crops.find(c => c.name === crop);
      if (selectedCrop) {
        const taskTypes = selectedCrop.tasks.map(task => task.taskType);
        const uniqueTaskTypes = Array.from(new Set(taskTypes));
        setAvailableTaskTypes(uniqueTaskTypes);
        
        // 現在の作業名が選択された作物の作業名に含まれていない場合、リセット
        if (!uniqueTaskTypes.includes(task)) {
          setTask("");
        }
      } else {
        setAvailableTaskTypes([]);
        setTask("");
      }
    } else {
      setAvailableTaskTypes([]);
      setTask("");
    }
  }, [isOpen, crop, task]);

  const handleCropChange = (value: string) => {
    setCrop(value);
    setTask(""); // 作物が変更されたら作業名をリセット
  };

  const handleTaskChange = (value: string) => {
    if (!crop) {
      toast({
        title: "エラー",
        description: "先に作物を選択してください",
        variant: "destructive",
      });
      return;
    }
    setTask(value);
  };

  const handleSave = () => {
    if (!crop || !task) {
      toast({
        title: "エラー",
        description: "作物と作業を選択してください",
        variant: "destructive",
      });
      return;
    }

    const updatedRecord = {
      ...record,
      crop,
      task,
      memo: memo || undefined,
      photoUrl: photoUrl || undefined,
    };

    updateFarmRecord(record.id, updatedRecord);
    onUpdate(updatedRecord);
    onClose();

    toast({
      title: "更新しました",
      description: "記録を更新しました",
    });
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 画像ファイルのみ許可
    if (!file.type.startsWith('image/')) {
      toast({
        title: "エラー",
        description: "画像ファイルを選択してください",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setPhotoUrl(base64String);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>記録を編集</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="crop">作物選択</Label>
            <Select value={crop} onValueChange={handleCropChange}>
              <SelectTrigger id="crop" className="w-full">
                <SelectValue placeholder="作物を選んでください" />
              </SelectTrigger>
              <SelectContent>
                {cropNames.map((cropName) => (
                  <SelectItem key={cropName} value={cropName}>
                    {cropName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task">作業名</Label>
            <Select 
              value={task} 
              onValueChange={handleTaskChange}
              disabled={!crop}
            >
              <SelectTrigger id="task" className="w-full">
                <SelectValue placeholder={crop ? "作業名を選んでください" : "先に作物を選択してください"} />
              </SelectTrigger>
              <SelectContent>
                {availableTaskTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo">メモ</Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="作業に関するメモを入力してください"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo">写真</Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="photo"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <label
                htmlFor="photo"
                className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50"
              >
                <Camera className="w-5 h-5" />
                <span>写真を選択</span>
              </label>
              {photoUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setPhotoUrl(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
            {photoUrl && (
              <div className="relative w-full h-48 mt-2">
                <Image
                  src={photoUrl}
                  alt="作業写真"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            )}
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