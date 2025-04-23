"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Repeat, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveFarmRecord, getLatestFarmRecord } from "@/lib/utils/farm-storage";
import { NewFarmRecord } from "@/types/farm";
import Image from "next/image";

const crops = ["トマト", "レタス", "にんじん", "じゃがいも", "とうもろこし", "その他"];
const tasks = ["水やり", "肥料", "収穫", "植え付け", "除草", "害虫駆除"];

export default function HomeScreen() {
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [memo, setMemo] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const { toast } = useToast();

  const handleSave = () => {
    if (!selectedCrop || !selectedTask) {
      toast({
        title: "エラー",
        description: "作物と作業を選択してください",
        variant: "destructive",
      });
      return;
    }

    const record: NewFarmRecord = {
      userId: "demo-user",
      date: format(new Date(), "yyyy-MM-dd"),
      crop: selectedCrop,
      task: selectedTask,
      memo: memo || undefined,
      photoUrl: photoUrl || undefined,
    };

    saveFarmRecord(record);

    // 保存完了のトーストを表示
    toast({
      title: "保存しました",
      description: `${selectedCrop}の${selectedTask}を記録しました`,
    });

    // フォームをリセット
    setSelectedCrop("");
    setSelectedTask("");
    setMemo("");
    setPhotoUrl("");
  };

  const handleRepeatLastRecord = () => {
    const lastRecord = getLatestFarmRecord();
    
    if (!lastRecord) {
      toast({
        title: "エラー",
        description: "前回の記録が見つかりません",
        variant: "destructive",
      });
      return;
    }

    // 前回の記録をフォームに反映（photoUrlは反映しない）
    setSelectedCrop(lastRecord.crop);
    setSelectedTask(lastRecord.task);
    setMemo(lastRecord.memo || "");

    toast({
      title: "前回の記録を読み込みました",
      description: "内容を確認・編集して保存してください",
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
    <div className="max-w-md mx-auto p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-semibold text-green-800">
          {format(new Date(), "yyyy年 M月 d日 (EEEE)", { locale: ja })}
        </h1>
        <p className="text-gray-600">本日の農作業を記録</p>
      </motion.div>

      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="crop">作物を選択</Label>
            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger id="crop" className="w-full">
                <SelectValue placeholder="作物を選んでください" />
              </SelectTrigger>
              <SelectContent>
                {crops.map((crop) => (
                  <SelectItem key={crop} value={crop}>
                    {crop}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task">作業を選択</Label>
            <Select value={selectedTask} onValueChange={setSelectedTask}>
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
            <Label htmlFor="memo">メモ（任意）</Label>
            <Textarea
              id="memo"
              placeholder="詳細な情報を入力..."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>写真（任意）</Label>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
                id="photo-input"
              />
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => document.getElementById('photo-input')?.click()}
              >
                <Camera className="w-5 h-5" />
                写真を追加
              </Button>
              {photoUrl && (
                <div className="relative">
                  <Image
                    src={photoUrl}
                    alt="アップロードされた写真"
                    width={300}
                    height={200}
                    className="rounded-lg object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    onClick={() => setPhotoUrl("")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <Button 
          className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
          onClick={handleSave}
        >
          作業を記録する
        </Button>
        <Button 
          variant="outline" 
          className="w-full h-12 gap-2"
          onClick={handleRepeatLastRecord}
        >
          <Repeat className="w-5 h-5" />
          前回の記録を繰り返す
        </Button>
      </div>
    </div>
  );
}