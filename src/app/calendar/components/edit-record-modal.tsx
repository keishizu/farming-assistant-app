"use client";

import { useState, useEffect, ChangeEvent, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateFarmRecord } from "@/services/farmRecord-service";
import { FarmRecord } from "@/types/farm";
import { getCustomCrops } from "@/services/customCrop-service";
import { getSmartCrops } from "@/services/smartCrop-service";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { useAuth } from "@clerk/nextjs";
import { useSupabaseWithAuth } from "@/lib/supabase";
import { uploadImage, getSignedImageUrl, deleteImage } from "@/services/upload-image";
import { Skeleton } from "@/components/ui/skeleton";

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FarmRecord;
  onUpdate: (record: FarmRecord) => void;
}

export function EditRecordModal({
  isOpen,
  onClose,
  record,
  onUpdate,
}: EditRecordModalProps) {
  const { userId, getToken } = useAuth();
  const supabase = useSupabaseWithAuth();
  const [cropName, setCropName] = useState(record.crop);
  const [taskName, setTaskName] = useState(record.task);
  const [memo, setMemo] = useState(record.memo || "");
  const [photoPath, setPhotoPath] = useState(record.photoPath || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [isLoadingExistingImage, setIsLoadingExistingImage] = useState(false);
  const [existingImageError, setExistingImageError] = useState<string | null>(null);
  const [cropNames, setCropNames] = useState<string[]>([]);
  const [expandedImage, setExpandedImage] = useState<{ url: string; alt: string } | null>(null);
  const { toast } = useToast();
  
  // 初期パスを保持（旧ファイル削除用）
  const originalPathRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchCropNames = async () => {
      if (!userId || !supabase) return;
      try {
        const token = await getToken({ template: "supabase" });
        if (!token) {
          throw new Error("認証トークンの取得に失敗しました");
        }
        const [customCrops, smartCrops] = await Promise.all([
          getCustomCrops(supabase, userId, token),
          getSmartCrops(supabase, userId),
        ]);
        const allCrops = [...customCrops, ...smartCrops];
        const names = Array.from(new Set(allCrops.map((crop) => crop.name)));
        setCropNames(names);
      } catch (error) {
        console.error("Failed to fetch crop names:", error);
        toast({
          title: "エラー",
          description: "作物名の取得に失敗しました",
          variant: "destructive",
        });
      }
    };

    fetchCropNames();
  }, [userId, supabase, getToken, toast]);

  // モーダルが開かれた時に状態を初期化
  useEffect(() => {
    if (isOpen) {
      setCropName(record.crop);
      setTaskName(record.task);
      setMemo(record.memo || "");
      setPhotoPath(record.photoPath || "");
      setSelectedFile(null);
      setPreviewUrl(null);
      setExistingImageUrl(null);
      setExistingImageError(null);
      
      // 初期パスを更新
      originalPathRef.current = record.photoPath || null;
      
      // console.log('Modal opened with record:', {
      //   recordPhotoPath: record.photoPath,
      //   originalPathRef: originalPathRef.current
      // });
      
      // 既存画像がある場合は署名付きURLを取得
      if (record.photoPath && supabase) {
        setIsLoadingExistingImage(true);
        setExistingImageError(null);
        
        getSignedImageUrl(supabase, record.photoPath)
          .then(url => {
            if (url) {
              setExistingImageUrl(url);
            } else {
              setExistingImageError("画像の取得に失敗しました");
            }
          })
          .catch(error => {
            console.error("Failed to get existing image URL:", error);
            setExistingImageError("画像の読み込みに失敗しました");
          })
          .finally(() => {
            setIsLoadingExistingImage(false);
          });
      } else {
        setIsLoadingExistingImage(false);
      }
    }
  }, [isOpen, record, supabase]);

  // モーダルが閉じられた時にプレビューURLをクリーンアップ
  useEffect(() => {
    if (!isOpen) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setSelectedFile(null);
      setExistingImageUrl(null);
      setIsLoadingExistingImage(false);
      setExistingImageError(null);
    }
  }, [isOpen, previewUrl]);

  const handleSave = async () => {
    // console.log('=== EditRecordModal handleSave started ===');
    // console.log('Current state:', {
    //   cropName,
    //   taskName,
    //   memo,
    //   photoPath,
    //   previewUrl,
    //   selectedFile: selectedFile ? { name: selectedFile.name, size: selectedFile.size } : null,
    //   record,
    //   originalPath: originalPathRef.current
    // });

    if (!cropName || !taskName) {
      // console.log('Validation failed: missing cropName or taskName');
      toast({
        title: "エラー",
        description: "作物名と作業名は必須です",
        variant: "destructive",
      });
      return;
    }

    if (!userId || !supabase) {
      // console.log('Validation failed: missing userId or supabase client');
      toast({
        title: "エラー",
        description: "認証情報が不足しています",
        variant: "destructive",
      });
      return;
    }

    try {
      // console.log('Getting session token...');
      const token = await getToken({ template: "supabase" });
      // console.log('Session token obtained:', token ? 'present' : 'missing');

      if (!token) {
        // console.log('Validation failed: missing token');
        toast({
          title: "エラー",
          description: "認証トークンの取得に失敗しました",
          variant: "destructive",
        });
        return;
      }

      let finalPhotoPath = photoPath;
      let newImageUploaded = false;

      // selectedFileは既にhandlePhotoSelectでアップロード済みなので、
      // photoPathをそのまま使用し、新規画像がアップロードされたかどうかを判定
      if (selectedFile && photoPath && photoPath !== originalPathRef.current) {
        newImageUploaded = true;
      }

      const updatedRecord: FarmRecord = {
        ...record,
        crop: cropName,
        task: taskName,
        memo: memo || undefined,
        photoPath: finalPhotoPath || undefined,
      };

      // console.log('Preparing to update record in database:', {
      //   id: record.id,
      //   userId: userId,
      //   updateData: {
      //     crop: cropName,
      //     task: taskName,
      //     memo: memo || undefined,
      //     photoPath: finalPhotoPath || undefined,
      //   }
      // });

      // console.log('Calling updateFarmRecord...');
      const updateResult = await updateFarmRecord(
        supabase,
        userId,
        token,
        record.id,
        {
          crop: cropName,
          task: taskName,
          memo: memo || undefined,
          photoPath: finalPhotoPath || undefined,
        }
      );

      // console.log('Record updated in database successfully:', updateResult);

      // DB更新成功後、旧ファイルを削除
      // console.log('Checking for old image deletion:', {
      //   originalPath: originalPathRef.current,
      //   finalPhotoPath,
      //   newImageUploaded,
      //   shouldDelete: originalPathRef.current && 
      //                originalPathRef.current !== finalPhotoPath && 
      //                newImageUploaded
      // });

      if (
        originalPathRef.current &&
        originalPathRef.current !== finalPhotoPath &&
        newImageUploaded
      ) {
        // console.log('Deleting old image:', originalPathRef.current);
        const deleteResult = await deleteImage(supabase, originalPathRef.current);
        
        if (deleteResult === "success") {
          // console.log('Old image deleted successfully');
          toast({
            title: "更新しました",
            description: "記録を更新し、古い画像を削除しました",
          });
        } else {
          console.error("Failed to delete old image:", {
            path: originalPathRef.current,
            result: deleteResult
          });
          toast({
            title: "警告",
            description: "記録は更新されましたが、古い画像の削除に失敗しました",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "更新しました",
          description: "記録を更新しました",
        });
      }

      onUpdate(updatedRecord);
      onClose();
    } catch (error) {
      console.error("Failed to update record:", error);
      
      // DB更新失敗時、新しくアップロードした画像を削除
      if (selectedFile && photoPath && photoPath !== originalPathRef.current) {
        // console.log('Rolling back uploaded image due to DB update failure:', photoPath);
        const rollbackResult = await deleteImage(supabase, photoPath);
        
        if (rollbackResult === "success") {
          // console.log('Rollback image deleted successfully');
        } else {
          console.error("Failed to rollback uploaded image:", {
            path: photoPath,
            result: rollbackResult
          });
        }
      }

      toast({
        title: "更新エラー",
        description: "記録の更新に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handlePhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
    }

    try {
      const { path, signedUrl } = await uploadImage(file, supabase, userId);
      setPhotoPath(path);        // DB 用
      setPreviewUrl(signedUrl);  // その場プレビュー用
      setSelectedFile(file);
      // console.log('Preview URL created:', signedUrl);
      // console.log('New image uploaded');
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
    // 新規アップロードした画像をSupabase Storageから削除
    if (selectedFile && photoPath && photoPath !== originalPathRef.current && supabase) {
      deleteImage(supabase, photoPath).then(result => {
        if (result !== "success") {
          console.error("Failed to delete uploaded image:", {
            path: photoPath,
            result
          });
        }
      });
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setSelectedFile(null);
    }
    setPhotoPath("");
    setExistingImageUrl(null);
    setExistingImageError(null);
    setIsLoadingExistingImage(false);
    // ファイル入力をリセット
    const fileInput = document.getElementById('photo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // 画像表示コンポーネント
  const renderImageSection = () => {
    if (isLoadingExistingImage) {
      return (
        <div className="space-y-2">
          <Label>写真 (読み込み中...)</Label>
          <div className="relative w-full h-48">
            <Skeleton className="w-full h-full rounded-lg" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          </div>
        </div>
      );
    }

    if (existingImageError) {
      return (
        <div className="space-y-2">
          <Label>写真</Label>
          <div className="relative w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-sm">画像の読み込みに失敗しました</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  if (record.photoPath && supabase) {
                    setIsLoadingExistingImage(true);
                    setExistingImageError(null);
                    getSignedImageUrl(supabase, record.photoPath)
                      .then(url => {
                        if (url) {
                          setExistingImageUrl(url);
                        } else {
                          setExistingImageError("画像の取得に失敗しました");
                        }
                      })
                      .catch(error => {
                        console.error("Failed to get existing image URL:", error);
                        setExistingImageError("画像の読み込みに失敗しました");
                      })
                      .finally(() => {
                        setIsLoadingExistingImage(false);
                      });
                  }
                }}
              >
                再試行
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (photoPath || previewUrl || existingImageUrl) {
      const imageUrl = previewUrl || existingImageUrl;
      
      // 有効なURLがある場合のみImageコンポーネントを表示
      if (imageUrl) {
        return (
          <div className="space-y-2">
            <Label>写真{previewUrl && " (プレビュー)"}</Label>
            <div className="relative w-full h-48 cursor-pointer" 
                 onClick={() => setExpandedImage({
                   url: imageUrl,
                   alt: "記録の写真"
                 })}>
              <Image
                src={imageUrl}
                alt="記録の写真"
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemovePhoto();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      }
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>記録を編集</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cropName">作物名</Label>
            <Select value={cropName} onValueChange={setCropName}>
              <SelectTrigger>
                <SelectValue placeholder="作物を選択" />
              </SelectTrigger>
              <SelectContent>
                {cropNames.length === 0 ? (
                  <SelectItem value="no-crops" disabled>
                    作物がありません
                  </SelectItem>
                ) : (
                  cropNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taskName">作業名</Label>
            <Input
              id="taskName"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="作業名を入力してください"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo">メモ</Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="メモを入力してください"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo">写真</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
            />
          </div>

          {renderImageSection()}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </div>
      </DialogContent>

      {/* 画像拡大表示モーダル */}
      {expandedImage && (
        <Dialog open={Boolean(expandedImage)} onOpenChange={() => setExpandedImage(null)}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-transparent border-none shadow-none">
            <div className="relative w-full h-full">
              <Button
                variant="outline"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white border-white/20"
                onClick={() => setExpandedImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="w-full h-full flex items-center justify-center">
                <Image
                  src={expandedImage.url}
                  alt={expandedImage.alt}
                  width={800}
                  height={600}
                  className="max-w-full max-h-full object-contain"
                  sizes="(max-width: 768px) 90vw, (max-width: 1200px) 80vw, 70vw"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
