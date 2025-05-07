"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CustomCrop } from "@/types/crop";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { EditCropModal } from "./edit-crop-modal";
import { useToast } from "@/hooks/use-toast";

interface CropCardProps {
  crop: CustomCrop;
  onUpdate: (crop: CustomCrop) => void;
  onDelete: (cropId: string) => void;
}

export function CropCard({ crop, onUpdate, onDelete }: CropCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  const handleDelete = () => {
    if (window.confirm("この作物を削除してもよろしいですか？")) {
      onDelete(crop.id);
      toast({
        title: "削除しました",
        description: "作物を削除しました",
      });
    }
  };

  return (
    <>
      <Card className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">{crop.name}</h3>
            <p className="text-sm text-muted-foreground">
              定植日: {format(crop.startDate, "yyyy年MM月dd日", { locale: ja })}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              編集
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              削除
            </Button>
          </div>
        </div>

        {crop.memo && (
          <p className="text-sm text-muted-foreground mb-4">
            {crop.memo}
          </p>
        )}

        <div className="space-y-2">
          {crop.tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-2 border rounded"
            >
              <div>
                <p className="font-medium">{task.taskType}</p>
                {task.memo && (
                  <p className="text-sm text-muted-foreground">
                    {task.memo}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <EditCropModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        crop={crop}
        onUpdate={onUpdate}
      />
    </>
  );
} 