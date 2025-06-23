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
import { uploadImage, getSignedImageUrl } from "@/services/upload-image";
import { getCustomCrops } from "@/services/customCrop-service";
import { getSmartCrops } from "@/services/smartCrop-service";
import { CustomCrop } from "@/types/crop";

export default function HomeScreen() {
  const { userId, getToken } = useAuth();
  const supabase = useSupabaseWithAuth();
  const [crop, setCrop] = useState("");
  const [task, setTask] = useState("");
  const [memo, setMemo] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropNames, setCropNames] = useState<string[]>([]);
  const [availableTaskTypes, setAvailableTaskTypes] = useState<string[]>([]);
  const [customCrops, setCustomCrops] = useState<CustomCrop[]>([]);
  const [smartCrops, setSmartCrops] = useState<CustomCrop[]>([]);
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
    if (!userId) return;

    const fetchCrops = async () => {
      try {
        const token = await getToken({ template: "supabase" });
        if (!token) throw new Error("Token not found");
        const [customCropsData, smartCropsData] = await Promise.all([
          getCustomCrops(supabase!, userId, token),
          getSmartCrops(supabase!, userId),
        ]);
        setCustomCrops(customCropsData);
        setSmartCrops(smartCropsData);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCrops();
  }, [userId, getToken, supabase]);

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

  // コンポーネントのアンマウント時にプレビューURLをクリーンアップ
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

    // selectedFileは既にhandlePhotoSelectでアップロード済みなので、
    // photoPathをそのまま使用する
    const finalPhotoPath = photoPath;

    // 作物名からcropIdを取得
    const allCrops = [...customCrops, ...smartCrops];
    const selectedCrop = allCrops.find(c => c.name === crop);
    const cropId = selectedCrop?.id || "";

    const record: NewFarmRecord = {
      userId,
      cropId,
      date: format(date, "yyyy-MM-dd"),
      crop,
      task,
      memo: memo || undefined,
      photoPath: finalPhotoPath || undefined,
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
      setPhotoPath("");
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
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

  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId || !supabase) return;

    // console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

    if (!file.type.startsWith("image/")) {
      toast({
        title: "エラー",
        description: "画像ファイルを選択してください",
        variant: "destructive",
      });
      return;
    }

    // 既存のプレビューURLをクリーンアップ
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      // console.log('Previous preview URL cleaned up');
    }

    try {
      const { path, signedUrl } = await uploadImage(file, supabase, userId);
      setPhotoPath(path);        // DB 用
      setPreviewUrl(signedUrl);  // その場プレビュー用
      setSelectedFile(file);
      // console.log('Preview URL created:', signedUrl);
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast({
        title: "エラー",
        description: `画像のアップロードに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleRemovePhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    setPhotoPath("");
    
    // ファイル入力をリセット
    const fileInput = document.getElementById('photo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
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
              {(photoPath || previewUrl) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemovePhoto}
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
            {(photoPath || previewUrl) && (
              <div className="relative w-full h-48 mt-2">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="作業写真"
                    fill
                    className="object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <p className="text-sm">画像を読み込み中...</p>
                    </div>
                  </div>
                )}
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
