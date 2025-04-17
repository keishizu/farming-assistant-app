import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CustomCrop } from "@/lib/types/crop";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface AddCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (crop: CustomCrop) => void;
}

export function AddCropModal({ isOpen, onClose, onAdd }: AddCropModalProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [memo, setMemo] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCrop: CustomCrop = {
      id: uuidv4(),
      name,
      startDate: new Date(startDate),
      memo: memo || undefined,
      tasks: [],
    };

    onAdd(newCrop);
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setStartDate("");
    setMemo("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>作物を追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">作物名</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">栽培開始日</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memo">メモ</Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit">追加</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 