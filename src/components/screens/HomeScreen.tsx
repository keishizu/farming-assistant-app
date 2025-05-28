"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveFarmRecord } from "@/services/farmRecord-service";
import { NewFarmRecord } from "@/types/farm";
import {
  getCropNames,
  getTaskTypesForCrop,
} from "@/services/Supabase-crop-utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DatePicker } from "@/components/ui/date-picker";
import { useAuth } from "@clerk/nextjs";
import { useSupabaseWithAuth } from "@/lib/supabase";

export default function HomeScreen() {
  const { userId, getToken } = useAuth();
  const supabase = useSupabaseWithAuth();
  const [crop, setCrop] = useState("");
  const [task, setTask] = useState("");
  const [memo, setMemo] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cropNames, setCropNames] = useState<string[]>([]);
  const [availableTaskTypes, setAvailableTaskTypes] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    const fetchCropNames = async () => {
      try {
        const token = await getToken({ template: "supabase" });
        if (!token) throw new Error("Token not found");
        const names = await getCropNames(userId, token);
        setCropNames(names);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCropNames();
  }, [userId, getToken]);

  useEffect(() => {
    if (!userId || !crop) {
      setAvailableTaskTypes([]);
      setTask("");
      return;
    }

    const fetchTaskTypes = async () => {
      try {
        const token = await getToken({ template: "supabase" });
        if (!token) throw new Error("Token not found");
        const taskTypes = await getTaskTypesForCrop(userId, crop, token);
        setAvailableTaskTypes(taskTypes);
        if (!taskTypes.includes(task)) setTask("");
      } catch (err) {
        console.error(err);
      }
    };

    fetchTaskTypes();
  }, [userId, crop, task, getToken]);

  const handleCropChange = (value: string) => {
    setCrop(value);
    setTask("");
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

  const handleSave = async () => {
    if (!userId || !crop || !task) {
      toast({
        title: "エラー",
        description: "作物と作業を選択してください",
        variant: "destructive",
      });
      return;
    }

    const record: NewFarmRecord = {
      userId,
      date: format(date, "yyyy-MM-dd"),
      crop,
      task,
      memo: memo || undefined,
      photoUrl: photoUrl || undefined,
    };

    try {
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }
      await saveFarmRecord(supabase, userId, record);
      toast({
        title: "保存しました",
        description: `${crop}の${task}を記録しました`,
      });

      setCrop("");
      setTask("");
      setMemo("");
      setPhotoUrl("");
      setDate(new Date());
      router.refresh();
    } catch (error) {
      toast({
        title: "保存エラー",
        description: "作業記録の保存に失敗しました",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
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
            <DatePicker date={date} onSelect={setDate} />
          </div>

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
                <SelectValue
                  placeholder={
                    crop ? "作業名を選んでください" : "先に作物を選択してください"
                  }
                />
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
