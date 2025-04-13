"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Repeat } from "lucide-react";

const crops = ["トマト", "レタス", "にんじん", "じゃがいも", "とうもろこし", "その他"];
const tasks = ["水やり", "肥料", "収穫", "植え付け", "除草", "害虫駆除"];

export default function HomeScreen() {
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [memo, setMemo] = useState("");

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
        <p className="text-gray-600">本日の農作業を記録</p>
      </motion.div>

      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="crop">作物を選択</Label>
            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger id="crop" className="w-full">
                <SelectValue placeholder="作物を選んでください" />
              </SelectTrigger>
              <SelectContent>
                {crops.map((crop) => (
                  <SelectItem key={crop} value={crop}>
                    {crop}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task">作業を選択</Label>
            <Select value={selectedTask} onValueChange={setSelectedTask}>
              <SelectTrigger id="task" className="w-full">
                <SelectValue placeholder="作業を選んでください" />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((task) => (
                  <SelectItem key={task} value={task}>
                    {task}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo">メモ（任意）</Label>
            <Textarea
              id="memo"
              placeholder="詳細な情報を入力..."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {}}
          >
            <Camera className="w-5 h-5" />
            写真を追加
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-12">
          作業を記録する
        </Button>
        <Button variant="outline" className="w-full h-12 gap-2">
          <Repeat className="w-5 h-5" />
          前回の記録を繰り返す
        </Button>
      </div>
    </div>
  );
}