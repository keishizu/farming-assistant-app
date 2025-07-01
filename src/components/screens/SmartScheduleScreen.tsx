"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CustomCrop } from "@/types/crop";
import { useState, useEffect } from "react";
import { CropCard } from "@/app/smart-schedule/components/crop-card";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { saveSmartCrops, getSmartCrops, deleteSmartCrop } from "@/services/smartCrop-service";
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
        const smartCrops = await getSmartCrops(supabase, session.user.id, session);
        setCrops(smartCrops);
        setIsMounted(true);
      } catch (error: any) {
        console.error("Failed to fetch smart crops:", error);
        
        // JWT expired エラーの場合、トークン更新を試行
        if (error?.message?.includes('JWT expired') || error?.code === 'PGRST301') {
          try {
            console.log('JWT expired, attempting token refresh at component level...');
            const newToken = await session.getToken({ template: "supabase" });
            if (newToken) {
              // 新しいトークンでクライアントを更新
              await supabase.auth.setSession({ access_token: newToken, refresh_token: "" });
              
              // 再試行
              const smartCrops = await getSmartCrops(supabase, session.user.id, session);
              setCrops(smartCrops);
              setIsMounted(true);
              return;
            }
          } catch (refreshError) {
            console.error('Token refresh failed at component level:', refreshError);
            toast({
              title: "セッション切れ",
              description: "ページを再読み込みしてください。",
              variant: "destructive",
            });
            return;
          }
        }
        
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
        await saveSmartCrops(supabase, session.user.id, crops, session);
      } catch (error: any) {
        console.error("Failed to save smart crops:", error);
        
        // 409エラー（主キー重複）の場合の特別な処理
        if (error?.message?.includes('duplicate key value violates unique constraint') || 
            error?.message?.includes('smart_crops_pkey')) {
          console.warn("Duplicate key error detected, attempting to refresh data...");
          try {
            // データを再取得して状態を同期
            const freshCrops = await getSmartCrops(supabase, session.user.id, session);
            setCrops(freshCrops);
            toast({
              title: "警告",
              description: "データの同期を行いました",
              variant: "default",
            });
            return;
          } catch (refreshError) {
            console.error("Failed to refresh data:", refreshError);
          }
        }
        
        // JWT expired エラーの場合、トークン更新を試行
        if (error?.message?.includes('JWT expired') || error?.code === 'PGRST301') {
          try {
            console.log('JWT expired, attempting token refresh at component level...');
            const newToken = await session.getToken({ template: "supabase" });
            if (newToken) {
              // 新しいトークンでクライアントを更新
              await supabase.auth.setSession({ access_token: newToken, refresh_token: "" });
              
              // 再試行
              await saveSmartCrops(supabase, session.user.id, crops, session);
              return;
            }
          } catch (refreshError) {
            console.error('Token refresh failed at component level:', refreshError);
            toast({
              title: "セッション切れ",
              description: "ページを再読み込みしてください。",
              variant: "destructive",
            });
            return;
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
      await saveSmartCrops(supabase, session.user.id, updatedCrops, session);
      setCrops(updatedCrops);
      setIsAddModalOpen(false);
    } catch (error: any) {
      console.error("Failed to save smart crop:", error);
      
      // 409エラー（主キー重複）の場合の特別な処理
      if (error?.message?.includes('duplicate key value violates unique constraint') || 
          error?.message?.includes('smart_crops_pkey')) {
        toast({
          title: "警告",
          description: "作物の追加に失敗しました。データを再読み込みしてください。",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "エラー",
        description: `作物の保存に失敗しました: ${error.message || '不明なエラー'}`,
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
      await saveSmartCrops(supabase, session.user.id, updatedCrops, session);
      setCrops(updatedCrops);
    } catch (error: any) {
      console.error("Failed to update smart crop:", error);
      
      // 409エラー（主キー重複）の場合の特別な処理
      if (error?.message?.includes('duplicate key value violates unique constraint') || 
          error?.message?.includes('smart_crops_pkey')) {
        toast({
          title: "警告",
          description: "作物の更新に失敗しました。データを再読み込みしてください。",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "エラー",
        description: `作物の更新に失敗しました: ${error.message || '不明なエラー'}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCrop = async (cropId: string) => {
    console.log("handleDeleteCrop called with cropId:", cropId);
    console.log("Current crops:", crops);
    
    if (!session?.user?.id) {
      toast({
        title: "認証エラー",
        description: "ユーザー情報が取得できません。ログインしてください。",
        variant: "destructive",
      });
      return;
    }

    try {
      // まず個別削除を試行
      console.log("Attempting individual crop deletion for cropId:", cropId);
      const deleteSuccess = await deleteSmartCrop(supabase, session.user.id, cropId, session);
      
      if (deleteSuccess) {
        console.log("Individual deletion successful, updating local state");
        const updatedCrops = crops.filter(crop => crop.id !== cropId);
        setCrops(updatedCrops);
        
        toast({
          title: "削除完了",
          description: "作物を削除しました",
          variant: "default",
        });
        return;
      }
    } catch (deleteError: any) {
      console.log("Individual deletion failed, falling back to upsert method:", deleteError);
      
      // 個別削除が失敗した場合、upsert方式を使用
      try {
        const updatedCrops = crops.filter(crop => crop.id !== cropId);
        console.log("Updated crops after filter:", updatedCrops);
        console.log("Filtered out cropId:", cropId);
        
        await saveSmartCrops(supabase, session.user.id, updatedCrops, session);
        setCrops(updatedCrops);
        
        toast({
          title: "削除完了",
          description: "作物を削除しました",
          variant: "default",
        });
      } catch (upsertError: any) {
        console.error("Upsert deletion also failed:", upsertError);
        
        // 409エラー（主キー重複）の場合の特別な処理
        if (upsertError?.message?.includes('duplicate key value violates unique constraint') || 
            upsertError?.message?.includes('smart_crops_pkey')) {
          toast({
            title: "警告",
            description: "作物の削除に失敗しました。データを再読み込みしてください。",
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "エラー",
          description: `作物の削除に失敗しました: ${upsertError.message || '不明なエラー'}`,
          variant: "destructive",
        });
      }
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