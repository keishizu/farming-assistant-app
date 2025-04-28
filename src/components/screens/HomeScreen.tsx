"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveFarmRecord } from "@/services/farm-storage";
import { NewFarmRecord } from "@/types/farm";
import { TASK_TYPES } from "@/types/crop";
import { getCropNames } from "@/services/crop-storage";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DatePicker } from "@/components/ui/date-picker";

const tasks = TASK_TYPES.map((task) => task.label);

export default function HomeScreen() {
  const [crop, setCrop] = useState("");
  const [task, setTask] = useState("");
  const [memo, setMemo] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableCrops, setAvailableCrops] = useState<string[]>([]);
  const [workDate, setWorkDate] = useState(new Date());
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // 保存された作物名を取得
    const crops = getCropNames();
    setAvailableCrops(crops);
    
    if (crops.length === 0) {
      const { dismiss } = toast({
        title: "エラー",
        description: "作物スケジュールに作物が登録されていません。先に作物スケジュール画面で作物を登録してください。",
        variant: "destructive",
        duration: 5000,
        onClick: () => dismiss(),
      });
    }
  }, [toast]);

  const handleSave = () => {
    if (!crop || !task) {
      const { dismiss } = toast({
        title: "エラー",
        description: "作物と作業を選択してください",
        variant: "destructive",
        duration: 5000,
        onClick: () => dismiss(),
      });
      return;
    }

    const record: NewFarmRecord = {
      userId: "demo-user",
      date: format(workDate, "yyyy-MM-dd"),
      crop: crop,
      task: task,
      memo: memo || undefined,
      photoUrl: photoUrl || undefined,
    };

    saveFarmRecord(record);

    // 保存完了のトーストを表示
    const { dismiss } = toast({
      title: "保存しました",
      description: `${crop}の${task}を記録しました`,
      duration: 5000,
      onClick: () => dismiss(),
    });

    // フォームをリセット
    setCrop("");
    setTask("");
    setMemo("");
    setPhotoUrl("");
    setWorkDate(new Date());

    // カレンダー画面を更新
    router.refresh();
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
    <div className="max-w-md mx-auto p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-semibold text-green-800">
          {format(new Date(), "yyyy年 M月 d日 (EEEE)", { locale: ja })}
        </h1>
        <p className="text-gray-600">農作業を記録してみよう！</p>
      </motion.div>

      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workDate">作業日</Label>
            <DatePicker
              date={workDate}
              onSelect={setWorkDate}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="crop">作物選択</Label>
            <Select value={crop} onValueChange={setCrop}>
              <SelectTrigger id="crop" className="w-full">
                <SelectValue placeholder="作物を選んでください" />
              </SelectTrigger>
              <SelectContent>
                {availableCrops.map((cropName) => (
                  <SelectItem key={cropName} value={cropName}>
                    {cropName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task">作業分類</Label>
            <Select value={task} onValueChange={setTask}>
              <SelectTrigger id="task" className="w-full">
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

        <div className="space-y-3">
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
            onClick={handleSave}
          >
            作業を記録する
          </Button>
        </div>
      </Card>
    </div>
  );
}