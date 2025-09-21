"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CustomCrop } from "@/types/crop";
import { useState, useEffect } from "react";
import { AddCropModal } from "@/app/crop-schedule/components/add-crop-modal";
import { CropCard } from "@/app/crop-schedule/components/crop-card";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { getCustomCrops, saveCustomCrop, deleteCustomCrop } from "@/services/customCrop-service";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function CropScheduleScreen() {
  const { session, user, loading } = useAuth();
  const userId = user?.id;
  const supabase = getSupabaseClient();
  const [crops, setCrops] = useState<CustomCrop[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  // マウント時にデータを読み込む
  useEffect(() => {
    const fetchCrops = async () => {
      if (loading) {
        console.log("セッション読み込み中...");
        return;
      }

      if (!userId) {
        console.log("ユーザーIDがありません");
        return;
      }


      try {
        const token = session?.access_token;
        console.log("取得したトークン:", token ? "存在します" : "null");

        if (!token) {
          throw new Error("認証トークンの取得に失敗しました");
        }

        console.log("作物データの取得を開始します");
        const savedCrops = await getCustomCrops(supabase, userId, token, session);
        console.log("取得した作物データ:", savedCrops);
        setCrops(savedCrops);
        setIsMounted(true);
      } catch (error: any) {
        console.error("作物データの取得に失敗しました:", error);
        
        // JWT expired エラーの場合、セッション切れのメッセージを表示
        if (error?.message?.includes('JWT expired') || error?.code === 'PGRST301') {
          toast({
            title: "セッション切れ",
            description: "ページを再読み込みしてください。",
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "エラー",
          description: "作物データの取得に失敗しました",
          variant: "destructive",
        });
      }
    };

    fetchCrops();
  }, [userId, loading, toast]);

  // データが変更された時のみ保存
  useEffect(() => {
    const saveCrops = async () => {
      if (!isMounted || !userId) return;

      try {
        await saveCustomCrop(supabase, userId, crops, session);
      } catch (error: any) {
        console.error("データの保存に失敗しました:", error);
        
        // JWT expired エラーの場合、セッション切れのメッセージを表示
        if (error?.message?.includes('JWT expired') || error?.code === 'PGRST301') {
          toast({
            title: "セッション切れ",
            description: "ページを再読み込みしてください。",
            variant: "destructive",
          });
          return;
        }
        
        // 409エラー（主キー重複）の場合の特別な処理
        if (error?.message?.includes('duplicate key value violates unique constraint') || 
            error?.message?.includes('custom_crops_pkey')) {
          console.warn("Duplicate key error detected, attempting to refresh data...");
          try {
            // データを再取得して状態を同期
            const token = session?.access_token;
            if (token) {
              const freshCrops = await getCustomCrops(supabase, userId, token, session);
              setCrops(freshCrops);
              toast({
                title: "警告",
                description: "データの同期を行いました",
                variant: "default",
              });
              return;
            }
          } catch (refreshError) {
            console.error("Failed to refresh data:", refreshError);
          }
        }
        
        toast({
          title: "エラー",
          description: `作物データの保存に失敗しました: ${error.message || '不明なエラー'}`,
          variant: "destructive",
        });
      }
    };
    saveCrops();
  }, [crops, isMounted, userId, session, toast]);

  const handleAddCrop = (newCrop: CustomCrop) => {
    setCrops(prevCrops => [...prevCrops, newCrop]);
    setIsAddModalOpen(false);
  };

  const handleUpdateCrop = (updatedCrop: CustomCrop) => {
    setCrops(prevCrops => prevCrops.map(crop => 
      crop.id === updatedCrop.id ? updatedCrop : crop
    ));
  };

  const handleDeleteCrop = async (cropId: string) => {
    if (!userId) return;

    try {
      await deleteCustomCrop(supabase, userId, cropId, session);
      setCrops(prevCrops => prevCrops.filter(crop => crop.id !== cropId));
      toast({
         description: "作物を削除しました",
      });
    } catch (error: any) {
      console.error("作物の削除に失敗しました:", error);
      
      // JWT expired エラーの場合、セッション切れのメッセージを表示
      if (error?.message?.includes('JWT expired') || error?.code === 'PGRST301') {
        toast({
          title: "セッション切れ",
          description: "ページを再読み込みしてください。",
          variant: "destructive",
        });
        return;
      }
      
      // 409エラー（主キー重複）の場合の特別な処理
      if (error?.message?.includes('duplicate key value violates unique constraint') || 
          error?.message?.includes('custom_crops_pkey')) {
        toast({
          title: "警告",
          description: "作物の削除に失敗しました。データを再読み込みしてください。",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "エラー",
        description: `作物の削除に失敗しました: ${error.message || '不明なエラー'}`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
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
        <p className="text-gray-600">自分で作成した栽培計画を管理</p>
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