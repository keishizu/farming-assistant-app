"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CustomCrop } from "@/types/crop";
import { useState, useEffect } from "react";
import { AddCropModal } from "@/app/crop-schedule/components/add-crop-modal";
import { CropCard } from "@/app/crop-schedule/components/crop-card";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { getCustomCrops, saveCustomCrop } from "@/services/customCrop-service";
import { useSession } from "@clerk/nextjs";
import { useSupabaseWithAuth } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function CropScheduleScreen() {
  const { session, isLoaded: isSessionLoaded } = useSession();
  const supabase = useSupabaseWithAuth();
  const [crops, setCrops] = useState<CustomCrop[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  // マウント時にデータを読み込む
  useEffect(() => {
    const loadCrops = async () => {
      if (!isSessionLoaded) {
        console.log("セッション読み込み中...");
        return;
      }

      if (!session?.user?.id) {
        console.log("セッションIDがありません");
        return;
      }

      if (!supabase) {
        console.log("Supabaseクライアントが初期化されていません");
        return;
      }
      
      try {
        const token = await session.getToken({ template: "supabase" });
        console.log("取得したトークン:", token ? "存在します" : "null");
        if (!token) {
          throw new Error("認証トークンの取得に失敗しました");
        }
        console.log("作物データの取得を開始します");
        const savedCrops = await getCustomCrops(supabase, session.user.id, token);
        console.log("取得した作物データ:", savedCrops);
        setCrops(savedCrops);
        setIsMounted(true);
      } catch (error) {
        console.error("データの読み込みに失敗しました:", error);
        toast({
          title: "エラー",
          description: "作物データの取得に失敗しました",
          variant: "destructive",
        });
      }
    };

    loadCrops();
  }, [session?.user?.id, supabase, isSessionLoaded, toast]);

  // データが変更された時のみ保存
  useEffect(() => {
    const saveCrops = async () => {
      if (!isMounted || !session?.user?.id || !supabase) return;

      try {
        await saveCustomCrop(supabase, session.user.id, crops);
      } catch (error) {
        console.error("データの保存に失敗しました:", error);
        toast({
          title: "エラー",
          description: "作物データの保存に失敗しました",
          variant: "destructive",
        });
      }
    };
    saveCrops();
  }, [crops, isMounted, session?.user?.id, supabase, toast]);

  const handleAddCrop = (newCrop: CustomCrop) => {
    setCrops(prevCrops => [...prevCrops, newCrop]);
    setIsAddModalOpen(false);
  };

  const handleUpdateCrop = (updatedCrop: CustomCrop) => {
    setCrops(prevCrops => prevCrops.map(crop => 
      crop.id === updatedCrop.id ? updatedCrop : crop
    ));
  };

  const handleDeleteCrop = (cropId: string) => {
    setCrops(prevCrops => prevCrops.filter(crop => crop.id !== cropId));
  };

  if (!isSessionLoaded || !supabase) {
    return <div className="flex justify-center items-center h-screen">読み込み中...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-semibold text-green-800">カスタムスケジュール</h1>
        <p className="text-gray-600">栽培計画を管理</p>
      </motion.div>

      <Card className="p-4">
        <div className="flex justify-end mb-4">
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            作物を追加
          </Button>
        </div>

        <div className="space-y-4">
          {crops.map(crop => (
            <CropCard
              key={crop.id}
              crop={crop}
              onUpdate={handleUpdateCrop}
              onDelete={handleDeleteCrop}
            />
          ))}
        </div>
      </Card>

      <AddCropModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCrop}
      />
    </div>
  );
} 