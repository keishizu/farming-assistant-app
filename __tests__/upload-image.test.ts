import { uploadImage, deleteImage, getSignedImageUrl } from '../src/services/upload-image';

// Supabaseクライアントをモック
const mockSupabase = {
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
      createSignedUrl: jest.fn(),
      remove: jest.fn(),
    })),
  },
};

// uuidをモック
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

// cryptoをモック
jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({
    update: jest.fn(() => ({
      digest: jest.fn(() => 'mock-hash'),
    })),
  })),
}));

// user-idユーティリティをモック
jest.mock('../src/utils/user-id', () => ({
  toStableUUID: jest.fn(() => 'stable-uuid'),
}));

describe('upload-image', () => {
  const mockUserId = 'test-user-id';
  const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* 目的: uploadImage関数が正しくファイルをアップロードし、パスとsignedUrlを返すことを確認 */
  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'test-user-id/stable-uuid-1234567890.jpg' },
        error: null,
      });

      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test-user-id/stable-uuid-1234567890.jpg' },
      });

      mockSupabase.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        createSignedUrl: jest.fn(),
        remove: jest.fn(),
      });

      const result = await uploadImage(mockFile, mockSupabase as any, mockUserId);

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('clerk-uploads');
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/^test-user-id\/stable-uuid-\d+\.jpg$/),
        mockFile,
        {
          cacheControl: '3600',
          upsert: true,
        }
      );
      expect(result.path).toMatch(/^test-user-id\/stable-uuid-\d+\.jpg$/);
      expect(result.signedUrl).toBe('https://example.com/test-user-id/stable-uuid-1234567890.jpg');
    });

    it('should throw error when upload fails', async () => {
      const mockUpload = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      });

      mockSupabase.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: jest.fn(),
        createSignedUrl: jest.fn(),
        remove: jest.fn(),
      });

      await expect(uploadImage(mockFile, mockSupabase as any, mockUserId))
        .rejects
        .toThrow('Failed to upload image: Upload failed');
    });

    it('should throw error for files larger than 6MB', async () => {
      const largeFile = new File(['x'.repeat(7 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      
      await expect(uploadImage(largeFile, mockSupabase as any, mockUserId))
        .rejects
        .toThrow('FILE_TOO_LARGE');
    });

    it('should throw error if MIME type is not image/*', async () => {
      const invalidFile = new File(['test'], 'bad.exe', { type: 'application/x-msdownload' });
      
      await expect(uploadImage(invalidFile, mockSupabase as any, mockUserId))
        .rejects
        .toThrow('INVALID_MIME');
    });
  });

  /* 目的: getSignedImageUrl関数が正しく署名付きURLを生成することを確認 */
  describe('getSignedImageUrl', () => {
    it('should create signed URL successfully', async () => {
      const mockCreateSignedUrl = jest.fn().mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed-url' },
      });

      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        createSignedUrl: mockCreateSignedUrl,
        remove: jest.fn(),
      });

      const result = await getSignedImageUrl(mockSupabase as any, 'test-path');

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('clerk-uploads');
      expect(mockCreateSignedUrl).toHaveBeenCalledWith('test-path', 3600);
      expect(result).toBe('https://example.com/signed-url');
    });

    it('should return empty string when signed URL creation fails', async () => {
      const mockCreateSignedUrl = jest.fn().mockResolvedValue({
        data: null,
      });

      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        createSignedUrl: mockCreateSignedUrl,
        remove: jest.fn(),
      });

      const result = await getSignedImageUrl(mockSupabase as any, 'test-path');

      expect(result).toBe('');
    });
  });

  /* 目的: deleteImage関数が正しく画像を削除することを確認 */
  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      const mockRemove = jest.fn().mockResolvedValue({
        error: null,
      });

      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        createSignedUrl: jest.fn(),
        remove: mockRemove,
      });

      await deleteImage(mockSupabase as any, 'test-path');

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('clerk-uploads');
      expect(mockRemove).toHaveBeenCalledWith(['test-path']);
    });

    it('should not delete when path is empty', async () => {
      const mockRemove = jest.fn();

      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        createSignedUrl: jest.fn(),
        remove: mockRemove,
      });

      await deleteImage(mockSupabase as any, '');

      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('should throw error when delete fails', async () => {
      const mockRemove = jest.fn().mockResolvedValue({
        error: { message: 'Delete failed' },
      });

      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        createSignedUrl: jest.fn(),
        remove: mockRemove,
      });

      await expect(deleteImage(mockSupabase as any, 'test-path'))
        .rejects
        .toThrow('画像の削除に失敗しました: Delete failed');
    });
  });
}); 