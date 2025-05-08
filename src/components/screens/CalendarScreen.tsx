'use client';

import { ScheduleCalendar } from '@/app/calendar/components/ScheduleCalendar';
import { RecordCalendar } from '@/app/calendar/components/RecordCalendar';
import { getFarmRecords } from '@/services/farm-storage';
import { getCrops } from '@/services/crop-storage';
import { generateTasksFromCrops } from '@/services/schedule-service';
import '@/app/calendar/calendar.css';
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useEffect, useState } from 'react';
import { Record, Task } from '@/types/calendar';

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
  const [records, setRecords] = useState<Record[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const loadRecords = () => {
    const farmRecords = getFarmRecords();
    const formattedRecords: Record[] = farmRecords.map(record => ({
      id: record.id,
      cropName: record.crop,
      taskName: record.task,
      date: new Date(record.date),
      memo: record.memo,
      photoUrl: record.photoUrl,
    }));
    setRecords(formattedRecords);
  };

  const loadTasks = () => {
    const generatedTasks = generateTasksFromCrops();
    setTasks(generatedTasks);
  };

  useEffect(() => {
    loadRecords();
    loadTasks();
  }, []);

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
            <p className="text-gray-600">予定と実績を確認</p>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={item}>
              <Card className="p-4 sm:p-6">
                <h2 className="text-xl font-semibold text-green-800 mb-4 sm:mb-6">予定カレンダー</h2>
                <ScheduleCalendar tasks={tasks} onUpdate={setTasks} />
              </Card>
            </motion.div>
            <motion.div variants={item}>
              <Card className="p-4 sm:p-6">
                <h2 className="text-xl font-semibold text-green-800 mb-4 sm:mb-6">実績カレンダー</h2>
                <RecordCalendar records={records} onUpdate={setRecords} />
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 