"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";

export default function CalendarScreen() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Mock data - replace with real data
  const hasActivity = (date: Date) => {
    return Math.random() > 0.7;
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-semibold text-green-800">農作業カレンダー</h1>
        <p className="text-gray-600">農作業の記録を確認</p>
      </motion.div>

      <Card className="p-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => {
            setDate(newDate);
            setSelectedDate(newDate);
          }}
          modifiers={{
            hasActivity: (date) => hasActivity(date),
          }}
          modifiersStyles={{
            hasActivity: {
              backgroundColor: "#dcfce7",
            },
          }}
          className="rounded-md border"
          locale={ja}
        />
      </Card>

      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, "yyyy年 M月 d日 (EEEE)", { locale: ja })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-800">午前の作業</h3>
              <p className="text-sm text-gray-600">水やり - トマト</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-medium text-orange-800">午後の作業</h3>
              <p className="text-sm text-gray-600">収穫 - にんじん</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}