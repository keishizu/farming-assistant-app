import { Task, Record } from '@/types/calendar';

// 仮のタスク（予定）データ
export const dummyTasks: Task[] = [
  {
    id: "1",
    cropName: "さつまいも",
    taskName: "植え付け",
    startDate: "2025-04-26",
    endDate: "2025-04-28",
    memo: "元気に育てたい！",
  },
  {
    id: "2",
    cropName: "トウモロコシ",
    taskName: "水やり",
    startDate: "2025-04-27",
    endDate: "2025-04-27",
  },
];

export const dummyRecords: Record[] = [
  {
    id: '1',
    cropName: 'トマト',
    taskName: '種まき',
    date: new Date(2024, 2, 15),
    memo: '種まき完了。発芽を待ちます。',
    photoUrl: '/images/tomato-seeding.jpg',
  },
  {
    id: '2',
    cropName: 'キュウリ',
    taskName: '種まき',
    date: new Date(2024, 2, 20),
    memo: '種まき完了。発芽を待ちます。',
  },
]; 