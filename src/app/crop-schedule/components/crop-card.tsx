import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { CustomCrop } from "@/types/crop";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { EditCropModal } from "./edit-crop-modal";
import { useState } from "react";

interface CropCardProps {
  crop: CustomCrop;
  onUpdate: (crop: CustomCrop) => void;
  onDelete: (cropId: string) => void;
}

export function CropCard({ crop, onUpdate, onDelete }: CropCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold">{crop.name}</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(crop.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              開始日: {format(crop.startDate, "yyyy年MM月dd日", { locale: ja })}
            </p>
            {crop.memo && (
              <p className="text-sm text-muted-foreground">{crop.memo}</p>
            )}
            <p className="text-sm text-muted-foreground">
              作業工程: {crop.tasks.length}件
            </p>
          </div>
        </CardContent>
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