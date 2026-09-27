import { Test, TestingModule } from '@nestjs/testing';
import { PrivacyService } from './privacy.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('PrivacyService', () => {
  let service: PrivacyService;
  let prisma: any;

  const mockPrismaService = {
    blockedUser: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    profile: {
      upsert: jest.fn(),
    },
    session: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrivacyService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PrivacyService>(PrivacyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('blockUser', () => {
    it('should throw BadRequestException when trying to block self', async () => {
      await expect(service.blockUser('user1', 'user1')).rejects.toThrow(BadRequestException);
    });

    it('should create block record if not existing', async () => {
      mockPrismaService.blockedUser.findUnique.mockResolvedValue(null);
      mockPrismaService.blockedUser.create.mockResolvedValue({
        id: 'block-1',
        userId: 'user1',
        blockedId: 'user2',
      });

      const res = await service.blockUser('user1', 'user2');
      expect(res.id).toBe('block-1');
      expect(mockPrismaService.blockedUser.create).toHaveBeenCalledWith({
        data: { userId: 'user1', blockedId: 'user2' },
        include: { blocked: { select: { id: true, username: true, avatarUrl: true } } },
      });
    });
  });

  describe('unblockUser', () => {
    it('should delete block records', async () => {
      mockPrismaService.blockedUser.deleteMany.mockResolvedValue({ count: 1 });
      const res = await service.unblockUser('user1', 'user2');
      expect(res.success).toBe(true);
      expect(mockPrismaService.blockedUser.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user1', blockedId: 'user2' },
      });
    });
  });

  describe('updatePrivacySettings', () => {
    it('should upsert user profile settings', async () => {
      mockPrismaService.profile.upsert.mockResolvedValue({
        userId: 'user1',
        showLastSeen: false,
        showReadReceipts: true,
      });

      const res = await service.updatePrivacySettings('user1', { showLastSeen: false });
      expect(res.showLastSeen).toBe(false);
      expect(mockPrismaService.profile.upsert).toHaveBeenCalled();
    });
  });
});
