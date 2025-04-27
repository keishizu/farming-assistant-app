'use client';

import { ScheduleCalendar } from '@/app/calendar/components/ScheduleCalendar';
import { RecordCalendar } from '@/app/calendar/components/RecordCalendar';
import { dummyTasks, dummyRecords } from '@/data/dummyData';
import '@/app/calendar/calendar.css';
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

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
                <ScheduleCalendar tasks={dummyTasks} />
              </Card>
            </motion.div>
            <motion.div variants={item}>
              <Card className="p-4 sm:p-6">
                <h2 className="text-xl font-semibold text-green-800 mb-4 sm:mb-6">実績カレンダー</h2>
                <RecordCalendar records={dummyRecords} />
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 