import { CropTask } from "./crop";
import { v4 as uuidv4 } from "uuid";

export interface DefaultCrop {
  id: string;
  name: string;
  tasks: CropTask[];
}

// さつまいものデフォルト作業工程
export const DEFAULT_SWEET_POTATO_TASKS: CropTask[] = [
  {
    id: uuidv4(),
    daysFromStart: 0,
    taskType: "植え付け",
    duration: 1,
    memo: "苗を植え付けます"
  },
  {
    id: uuidv4(),
    daysFromStart: 30,
    taskType: "追肥",
    duration: 1,
    memo: "肥料を追加します"
  },
  {
    id: uuidv4(),
    daysFromStart: 60,
    taskType: "土寄せ",
    duration: 1,
    memo: "土を寄せます"
  },
  {
    id: uuidv4(),
    daysFromStart: 120,
    taskType: "収穫",
    duration: 1,
    memo: "さつまいもを収穫します"
  }
];

// 利用可能な作物のリスト
export const AVAILABLE_CROPS: DefaultCrop[] = [
  {
    id: "sweet-potato",
    name: "さつまいも",
    tasks: DEFAULT_SWEET_POTATO_TASKS
  }
  // 他の作物もここに追加予定
];

// 他の作物のデフォルト作業工程もここに追加予定 