"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const tasks = [
  {
    id: 1,
    title: "トマトの水やり",
    description: "気温が高くなる予報のため、朝の水やりが必要です",
    completed: false,
  },
  {
    id: 2,
    title: "野菜の収穫",
    description: "レタスとにんじんの収穫適期を確認してください",
    completed: false,
  },
  {
    id: 3,
    title: "害虫チェック",
    description: "一般的な害虫や病気の兆候がないか確認してください",
    completed: false,
  },
];

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

export default function TodoScreen() {
  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-semibold text-green-800">今日のタスク</h1>
        <p className="text-gray-600">日々の農作業を管理</p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {tasks.map((task) => (
          <motion.div key={task.id} variants={item}>
            <Card className="p-4">
              <div className="flex items-start gap-4">
                <Checkbox id={`task-${task.id}`} className="mt-1" />
                <div className="flex-1">
                  <label
                    htmlFor={`task-${task.id}`}
                    className="text-lg font-medium cursor-pointer"
                  >
                    {task.title}
                  </label>
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}