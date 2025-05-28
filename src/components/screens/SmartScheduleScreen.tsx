"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CustomCrop } from "@/types/crop";
import { useState, useEffect } from "react";
import { CropCard } from "@/app/crop-schedule/components/crop-card";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { saveSmartCrops, getSmartCrops } from "@/services/smartCrop-service";
import { AddCropModal } from "@/app/smart-schedule/components/add-crop-modal";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@clerk/nextjs";
import { useSupabaseWithAuth } from "@/lib/supabase";

export default function SmartScheduleScreen() {
  const { session } = useSession();
  const supabase = useSupabaseWithAuth();
  const [crops, setCrops] = useState<CustomCrop[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCrops = async () => {
      if (!session?.user?.id || !supabase) return;

      try {
        const token = await session.getToken({ template: "supabase" });
        if (!token) {
          throw new Error("認証トークンの取得に失敗しました");
        }
        const smartCrops = await getSmartCrops(supabase, session.user.id);
        setCrops(smartCrops);
        setIsMounted(true);
      } catch (error) {
        console.error("Failed to fetch smart crops:", error);
        toast({
          title: "エラー",
          description: "作物データの取得に失敗しました",
          variant: "destructive",
        });
      }
    };

    fetchCrops();
  }, [session, supabase, toast]);

  useEffect(() => {
    const saveCrops = async () => {
      if (!isMounted || !session?.user?.id || !supabase) return;
      
      try {
        await saveSmartCrops(supabase, session.user.id, crops);
      } catch (error) {
        console.error("Failed to save smart crops:", error);
        toast({
          title: "エラー",
          description: "作物データの保存に失敗しました",
          variant: "destructive",
        });
      }
    };

    saveCrops();
  }, [crops, isMounted, session, supabase, toast]);

  if (!supabase) {
    return null;
  }

  const handleAddCrop = async (newCrop: CustomCrop) => {
    if (!session?.user?.id) {
      toast({
        title: "認証エラー",
        description: "ユーザー情報が取得できません。ログインしてください。",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedCrops = [...crops, newCrop];
      await saveSmartCrops(supabase, session.user.id, updatedCrops);
      setCrops(updatedCrops);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Failed to save smart crop:", error);
      toast({
        title: "エラー",
        description: `作物の保存に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        variant: "destructive",
      });
    }
  };

  const handleUpdateCrop = async (updatedCrop: CustomCrop) => {
    if (!session?.user?.id) {
      toast({
        title: "認証エラー",
        description: "ユーザー情報が取得できません。ログインしてください。",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedCrops = crops.map(crop => 
        crop.id === updatedCrop.id ? updatedCrop : crop
      );
      await saveSmartCrops(supabase, session.user.id, updatedCrops);
      setCrops(updatedCrops);
    } catch (error) {
      console.error("Failed to update smart crop:", error);
      toast({
        title: "エラー",
        description: "作物の更新に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCrop = async (cropId: string) => {
    if (!session?.user?.id) {
      toast({
        title: "認証エラー",
        description: "ユーザー情報が取得できません。ログインしてください。",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedCrops = crops.filter(crop => crop.id !== cropId);
      await saveSmartCrops(supabase, session.user.id, updatedCrops);
      setCrops(updatedCrops);
    } catch (error) {
      console.error("Failed to delete smart crop:", error);
      toast({
        title: "エラー",
        description: "作物の削除に失敗しました",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-semibold text-green-800">スマートスケジュール</h1>
        <p className="text-gray-600">AI提案の栽培計画を管理</p>
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