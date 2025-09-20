'use client';

import { ScheduleCalendar } from '@/app/calendar/components/ScheduleCalendar';
import { RecordCalendar } from '@/app/calendar/components/RecordCalendar';
import { getFarmRecords } from '@/services/farmRecord-service';
import { generateTasksFromCrops } from '@/services/schedule-service';
import { getCustomCrops } from '@/services/customCrop-service';
import { getSmartCrops } from '@/services/smartCrop-service';
import { useAuth } from '@/hooks/useAuth';
import { getSupabaseClient } from '@/lib/supabase';
import '@/app/calendar/calendar.css';
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from 'react';
import { Task } from '@/types/calendar';
import { FarmRecord } from '@/types/farm';
import { CustomCrop } from '@/types/crop';
import { addDays, format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function CalendarScreen() {
  const { user, session, getToken } = useAuth();
  const userId = user?.id;
  const supabase = getSupabaseClient();
  const [records, setRecords] = useState<FarmRecord[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customCrops, setCustomCrops] = useState<CustomCrop[]>([]);
  const [smartCrops, setSmartCrops] = useState<CustomCrop[]>([]);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) {
        console.error("認証トークンの取得に失敗しました");
        toast({
          title: "エラー",
          description: "認証トークンの取得に失敗しました",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const [farmRecords, customCropsData, smartCropsData] = await Promise.all([
        getFarmRecords(supabase, userId),
        getCustomCrops(supabase, userId, token, session),
        getSmartCrops(supabase, userId, session),
      ]);

      setRecords(farmRecords);
      setCustomCrops(customCropsData);
      setSmartCrops(smartCropsData);

      const allCrops = [...customCropsData, ...smartCropsData];
      const generatedTasks = await generateTasksFromCrops(supabase, userId, token, session);
      setTasks(generatedTasks);
    } catch (error: unknown) {
      console.error("データの読み込みに失敗しました:", error);
      
      // JWT expired エラーの場合、セッション切れのメッセージを表示
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && 
          (error.message.includes('JWT expired') || (error as any)?.code === 'PGRST301')) {
        toast({
          title: "セッション切れ",
          description: "ページを再読み込みしてください。",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "エラー",
        description: "データの読み込みに失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, getToken, toast, session]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecordUpdate = useCallback((updatedRecords: FarmRecord[]) => {
    setRecords(updatedRecords);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-2xl font-semibold text-green-800">農業カレンダー</h1>
            <p className="text-gray-600">提案と実績を確認</p>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={item}>
              <Card className="p-4 sm:p-6">
                <h2 className="text-xl font-semibold text-green-800 mb-4 sm:mb-6">提案カレンダー</h2>
                <ScheduleCalendar tasks={tasks} />
              </Card>
            </motion.div>
            <motion.div variants={item}>
              <Card className="p-4 sm:p-6">
                <h2 className="text-xl font-semibold text-green-800 mb-4 sm:mb-6">実績カレンダー</h2>
                <RecordCalendar records={records} onUpdate={handleRecordUpdate} />
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
