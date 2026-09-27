import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MediaService } from './media.service';

describe('MediaService', () => {
  let service: MediaService;

  const mockConfig = {
    get: jest.fn((key: string) => {
      if (key === 'R2_PUBLIC_DOMAIN') return 'https://cdn.nexchat.io';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generatePresignedUrl', () => {
    it('should generate valid file upload result for image/jpeg', async () => {
      const result = await service.generatePresignedUrl('test.jpg', 'image/jpeg', 1024);
      expect(result.fileKey).toContain('test.jpg');
      expect(result.publicUrl).toBeDefined();
    });

    it('should throw error for unsupported mime type', async () => {
      await expect(
        service.generatePresignedUrl('malicious.exe', 'application/x-msdownload', 1024),
      ).rejects.toThrow();
    });
  });
});
