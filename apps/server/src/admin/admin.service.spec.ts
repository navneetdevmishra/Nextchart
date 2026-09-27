import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: any;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    group: { count: jest.fn() },
    channel: { count: jest.fn() },
    callSession: { count: jest.fn() },
    message: { count: jest.fn() },
    userReport: { count: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStats', () => {
    it('should aggregate system metric counts', async () => {
      mockPrismaService.user.count.mockResolvedValue(100);
      mockPrismaService.group.count.mockResolvedValue(5);
      mockPrismaService.channel.count.mockResolvedValue(2);
      mockPrismaService.callSession.count.mockResolvedValue(12);
      mockPrismaService.message.count.mockResolvedValue(450);
      mockPrismaService.userReport.count.mockResolvedValue(1);

      const stats = await service.getStats();
      expect(stats.totalUsers).toBe(100);
      expect(stats.totalGroups).toBe(5);
      expect(stats.systemHealth).toBe('HEALTHY');
    });
  });

  describe('suspendUser', () => {
    it('should throw BadRequestException if admin suspends self', async () => {
      await expect(service.suspendUser('admin1', 'admin1')).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if target user is an ADMIN', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'admin2', role: 'ADMIN' });
      await expect(service.suspendUser('admin1', 'admin2')).rejects.toThrow(ForbiddenException);
    });

    it('should suspend user and log audit trail', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user1', username: 'baduser', role: 'USER' });
      mockPrismaService.user.update.mockResolvedValue({ id: 'user1', isSuspended: true });

      const res = await service.suspendUser('admin1', 'user1', 'Spamming');
      expect(res.isSuspended).toBe(true);
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'USER_SUSPEND', targetId: 'user1' }),
        }),
      );
    });
  });
});
