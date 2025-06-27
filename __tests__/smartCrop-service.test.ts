import { saveSmartCrops } from '../src/services/smartCrop-service';
import { CustomCrop } from '../src/types/crop';

// Supabaseクライアントをモック
const mockSupabase = {
  from: jest.fn(() => ({
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
    insert: jest.fn(),
  })),
};

describe('smartCrop-service', () => {
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* 目的: saveSmartCrops関数が正しく全削除→一括保存の上書き方式で動作し、user_id付きでonConflict("id")相当を呼んでいることを確認 */
  describe('saveSmartCrops', () => {
    const mockCrops: CustomCrop[] = [
      {
        id: 'smart-1',
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
        ],
        color: { text: 'text-red-500', bg: 'bg-red-100', label: '赤' },
      },
      {
        id: 'smart-2',
        name: 'キュウリ',
        startDate: '2024-01-15',
        memo: 'テスト用キュウリ',
        tasks: [
          {
            id: 'task-2',
            taskType: '植え付け',
            daysFromStart: 0,
            duration: 1,
            memo: '植え付け作業',
          },
        ],
        color: { text: 'text-green-500', bg: 'bg-green-100', label: '緑' },
      },
    ];

    it('should delete existing crops and insert new ones with user_id', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockReturnValue({
        delete: mockDelete,
        insert: mockInsert,
      });

      await saveSmartCrops(mockSupabase as any, mockUserId, mockCrops);

      // 削除処理の確認
      expect(mockSupabase.from).toHaveBeenCalledWith('smart_crops');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockDelete().eq).toHaveBeenCalledWith('user_id', mockUserId);

      // 挿入処理の確認
      expect(mockInsert).toHaveBeenCalledWith([
        {
          id: 'smart-1',
          user_id: mockUserId,
          crop_type: 'トマト',
          start_date: '2024-01-01',
          memo: 'テスト用トマト',
          tasks: [
            {
              id: 'task-1',
              taskType: '種まき',
              daysFromStart: 0,
              duration: 1,
              memo: '種まき作業',
            },
          ],
          color: { text: 'text-red-500', bg: 'bg-red-100', label: '赤' },
          created_at: expect.any(String),
        },
        {
          id: 'smart-2',
          user_id: mockUserId,
          crop_type: 'キュウリ',
          start_date: '2024-01-15',
          memo: 'テスト用キュウリ',
          tasks: [
            {
              id: 'task-2',
              taskType: '植え付け',
              daysFromStart: 0,
              duration: 1,
              memo: '植え付け作業',
            },
          ],
          color: { text: 'text-green-500', bg: 'bg-green-100', label: '緑' },
          created_at: expect.any(String),
        },
      ]);
    });

    it('should call delete and insert exactly once each', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockReturnValue({
        delete: mockDelete,
        insert: mockInsert,
      });

      await saveSmartCrops(mockSupabase as any, mockUserId, mockCrops);

      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledTimes(1);
    });

    it('should throw error when user is not authenticated', async () => {
      await expect(saveSmartCrops(mockSupabase as any, '', mockCrops))
        .rejects
        .toThrow('User not authenticated');
    });

    it('should throw error when delete fails', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ 
          error: { message: 'Delete failed' } 
        }),
      });

      mockSupabase.from.mockReturnValue({
        delete: mockDelete,
        insert: jest.fn(),
      });

      await expect(saveSmartCrops(mockSupabase as any, mockUserId, mockCrops))
        .rejects
        .toThrow('Failed to delete smart crops: Delete failed');
    });

    it('should throw error when insert fails', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const mockInsert = jest.fn().mockResolvedValue({ 
        error: { message: 'Insert failed' } 
      });

      mockSupabase.from.mockReturnValue({
        delete: mockDelete,
        insert: mockInsert,
      });

      await expect(saveSmartCrops(mockSupabase as any, mockUserId, mockCrops))
        .rejects
        .toThrow('Failed to insert smart crops: Insert failed');
    });

    it('should handle empty crops array', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockReturnValue({
        delete: mockDelete,
        insert: mockInsert,
      });

      await saveSmartCrops(mockSupabase as any, mockUserId, []);

      expect(mockDelete).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalledWith([]);
    });

    it('should format crop data correctly with created_at timestamp', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockReturnValue({
        delete: mockDelete,
        insert: mockInsert,
      });

      const singleCrop: CustomCrop[] = [{
        id: 'smart-1',
        name: 'トマト',
        startDate: '2024-01-01',
        memo: 'テスト用トマト',
        tasks: [],
        color: { text: 'text-red-500', bg: 'bg-red-100', label: '赤' },
      }];

      await saveSmartCrops(mockSupabase as any, mockUserId, singleCrop);

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'smart-1',
          user_id: mockUserId,
          crop_type: 'トマト',
          start_date: '2024-01-01',
          memo: 'テスト用トマト',
          tasks: [],
          color: { text: 'text-red-500', bg: 'bg-red-100', label: '赤' },
          created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        }),
      ]);
    });
  });
}); 