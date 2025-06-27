import { saveCustomCrop } from '../src/services/customCrop-service';
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

// supabase.tsをモック
jest.mock('../src/lib/supabase', () => ({
  getAuthenticatedSupabaseClient: jest.fn(),
}));

const mockSupabase = {
  from: jest.fn(() => ({
    upsert: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
};

describe('customCrop-service', () => {
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* 目的: saveCustomCrop関数が正しくupsertを呼び出し、user_idを含むデータで保存されることを確認 */
  describe('saveCustomCrop', () => {
    const mockCrops: CustomCrop[] = [
      {
        id: 'crop-1',
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
        id: 'crop-2',
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

    it('should call upsert with user_id included in data', async () => {
      const mockSelect = jest.fn().mockResolvedValue({ data: mockCrops, error: null });
      const mockUpsert = jest.fn(() => ({ select: mockSelect }));
      mockSupabase.from.mockReturnValue({ upsert: mockUpsert });

      await saveCustomCrop(mockSupabase as any, mockUserId, mockCrops);

      expect(mockSupabase.from).toHaveBeenCalledWith('custom_crops');
      expect(mockUpsert).toHaveBeenCalledWith([
        {
          id: 'crop-1',
          name: 'トマト',
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
          user_id: mockUserId,
        },
        {
          id: 'crop-2',
          name: 'キュウリ',
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
          user_id: mockUserId,
        },
      ]);
    });

    it('should call upsert exactly once', async () => {
      const mockSelect = jest.fn().mockResolvedValue({ data: mockCrops, error: null });
      const mockUpsert = jest.fn(() => ({ select: mockSelect }));
      mockSupabase.from.mockReturnValue({ upsert: mockUpsert });

      await saveCustomCrop(mockSupabase as any, mockUserId, mockCrops);

      expect(mockUpsert).toHaveBeenCalledTimes(1);
    });

    it('should throw error when user is not authenticated', async () => {
      await expect(saveCustomCrop(mockSupabase as any, '', mockCrops))
        .rejects
        .toThrow('User not authenticated');
    });

    it('should throw error when supabase client is not initialized', async () => {
      await expect(saveCustomCrop(null as any, mockUserId, mockCrops))
        .rejects
        .toThrow('Supabase client not initialized');
    });

    it('should throw error when upsert fails', async () => {
      const mockSelect = jest.fn().mockResolvedValue({ data: null, error: { message: 'Upsert failed' } });
      const mockUpsert = jest.fn(() => ({ select: mockSelect }));
      mockSupabase.from.mockReturnValue({ upsert: mockUpsert });

      await expect(saveCustomCrop(mockSupabase as any, mockUserId, mockCrops))
        .rejects
        .toThrow('Failed to insert crops: Upsert failed');
    });

    it('should handle RLS policy error', async () => {
      const mockSelect = jest.fn().mockResolvedValue({ data: null, error: { code: '42501', message: 'Permission denied' } });
      const mockUpsert = jest.fn(() => ({ select: mockSelect }));
      mockSupabase.from.mockReturnValue({ upsert: mockUpsert });

      await expect(saveCustomCrop(mockSupabase as any, mockUserId, mockCrops))
        .rejects
        .toThrow('アクセス権限がありません。RLSポリシーを確認してください。');
    });
  });
}); 