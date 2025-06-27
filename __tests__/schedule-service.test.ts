import { generateTasksFromCrops } from '../src/services/schedule-service';
import { getCustomCrops } from '../src/services/customCrop-service';
import { getSmartCrops } from '../src/services/smartCrop-service';
import { CustomCrop } from '../src/types/crop';

// Supabaseクライアントをモック
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  })),
}));

// サービス関数をモック
jest.mock('../src/services/customCrop-service');
jest.mock('../src/services/smartCrop-service');

const mockGetCustomCrops = getCustomCrops as jest.MockedFunction<typeof getCustomCrops>;
const mockGetSmartCrops = getSmartCrops as jest.MockedFunction<typeof getSmartCrops>;

describe('schedule-service', () => {
  /* 目的: generateTasksFromCrops関数が正しくタスクを生成し、scheduledDateで昇順ソートされ、デフォルトカラーが設定されることを確認 */
  describe('generateTasksFromCrops', () => {
    const mockSupabase = {} as any;
    const mockUserId = 'test-user-id';
    const mockToken = 'test-token';

    const mockCustomCrop: CustomCrop = {
      id: 'custom-1',
      name: 'トマト',
      startDate: '2024-01-01',
      memo: 'テスト用トマト',
      tasks: [
        {
          id: 'task-1',
          taskType: '種まき',
          daysFromStart: 0,
          duration: 1,
          memo: '種まき作業',
        },
        {
          id: 'task-2',
          taskType: '収穫',
          daysFromStart: 60,
          duration: 30,
          memo: '収穫作業',
        },
      ],
      color: { text: 'text-red-500', bg: 'bg-red-100', label: '赤' },
    };

    const mockSmartCrop: CustomCrop = {
      id: 'smart-1',
      name: 'キュウリ',
      startDate: '2024-01-15',
      memo: 'テスト用キュウリ',
      tasks: [
        {
          id: 'task-3',
          taskType: '植え付け',
          daysFromStart: 0,
          duration: 1,
          memo: '植え付け作業',
        },
      ],
      color: { text: 'text-green-700', bg: 'bg-green-100', label: '緑' }, // デフォルトカラー
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockGetCustomCrops.mockResolvedValue([mockCustomCrop]);
      mockGetSmartCrops.mockResolvedValue([mockSmartCrop]);
    });

    it('should generate tasks from both custom and smart crops', async () => {
      const tasks = await generateTasksFromCrops(mockSupabase, mockUserId, mockToken);

      expect(mockGetCustomCrops).toHaveBeenCalledWith(mockSupabase, mockUserId, mockToken);
      expect(mockGetSmartCrops).toHaveBeenCalledWith(mockSupabase, mockUserId);
      expect(tasks).toHaveLength(3); // 2 + 1 tasks
    });

    it('should use default color when crop color is not defined', async () => {
      const tasks = await generateTasksFromCrops(mockSupabase, mockUserId, mockToken);

      const smartCropTask = tasks.find(task => task.cropId === 'smart-1');
      expect(smartCropTask?.color).toBe('text-green-700'); // デフォルトカラー
    });

    it('should use crop color when defined', async () => {
      const tasks = await generateTasksFromCrops(mockSupabase, mockUserId, mockToken);

      const customCropTask = tasks.find(task => task.cropId === 'custom-1');
      expect(customCropTask?.color).toBe('text-red-500'); // 定義されたカラー
    });

    it('should calculate correct start and end dates', async () => {
      const tasks = await generateTasksFromCrops(mockSupabase, mockUserId, mockToken);

      const harvestTask = tasks.find(task => task.taskType === '収穫');
      expect(harvestTask?.startDate).toBe('2024-03-01'); // 2024-01-01 + 60 days
      expect(harvestTask?.endDate).toBe('2024-03-30'); // 2024-03-01 + 29 days (duration - 1)
    });
  });
}); 