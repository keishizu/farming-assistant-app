"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CustomCrop } from "@/types/crop";
import { useState, useEffect } from "react";
import { AddCropModal } from "@/app/crop-schedule/components/add-crop-modal";
import { CropCard } from "@/app/crop-schedule/components/crop-card";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { saveCrops, getCrops } from "@/lib/utils/crop-storage";

export default function CropScheduleScreen() {
  const [crops, setCrops] = useState<CustomCrop[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // マウント時にデータを読み込む
  useEffect(() => {
    setIsMounted(true);
    const savedCrops = getCrops();
    setCrops(savedCrops);
  }, []);

  // データが変更された時のみ保存
  useEffect(() => {
    if (isMounted) {
      saveCrops(crops);
    }
  }, [crops, isMounted]);

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

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-semibold text-green-800">作物スケジュール</h1>
        <p className="text-gray-600">作物の栽培計画を管理</p>
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