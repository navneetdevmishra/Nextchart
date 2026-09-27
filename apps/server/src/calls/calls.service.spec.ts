import { Test, TestingModule } from '@nestjs/testing';
import { CallsService } from './calls.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CallsService', () => {
  let service: CallsService;
  let prisma: any;

  const mockPrismaService = {
    blockedUser: {
      findFirst: jest.fn(),
    },
    callSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'STUN_SERVER') return 'stun:stun.l.google.com:19302';
      if (key === 'TURN_SERVER') return 'turn:turn.nexchat.io:3478';
      if (key === 'TURN_USERNAME') return 'nexchat_user';
      if (key === 'TURN_PASSWORD') return 'nexchat_pass';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CallsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<CallsService>(CallsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initiateCall', () => {
    it('should throw BadRequestException if calling oneself', async () => {
      await expect(service.initiateCall('user1', 'user1', 'VOICE')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if caller is blocked', async () => {
      mockPrismaService.blockedUser.findFirst.mockResolvedValue({ id: 'block-1' });

      await expect(service.initiateCall('caller1', 'recipient1', 'VOICE')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create call session if not blocked', async () => {
      mockPrismaService.blockedUser.findFirst.mockResolvedValue(null);
      mockPrismaService.callSession.create.mockResolvedValue({
        id: 'call-123',
        callerId: 'caller1',
        recipientId: 'recipient1',
        type: 'VOICE',
        status: 'INITIATED',
      });

      const result = await service.initiateCall('caller1', 'recipient1', 'VOICE');
      expect(result.id).toBe('call-123');
      expect(mockPrismaService.callSession.create).toHaveBeenCalled();
    });
  });

  describe('updateCallStatus', () => {
    it('should throw NotFoundException if call does not exist', async () => {
      mockPrismaService.callSession.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCallStatus('non-existent', 'user1', 'ACCEPTED'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update status to REJECTED', async () => {
      mockPrismaService.callSession.findUnique.mockResolvedValue({
        id: 'call-123',
        callerId: 'user1',
        recipientId: 'user2',
        status: 'INITIATED',
      });

      mockPrismaService.callSession.update.mockResolvedValue({
        id: 'call-123',
        status: 'REJECTED',
      });

      const result = await service.updateCallStatus('call-123', 'user2', 'REJECTED');
      expect(result.status).toBe('REJECTED');
    });
  });

  describe('getIceServers', () => {
    it('should return configured STUN and TURN ice servers', () => {
      const config = service.getIceServers();
      expect(config.iceServers).toHaveLength(2);
      expect(config.iceServers[0].urls).toContain('stun.l.google.com');
      expect(config.iceServers[1].urls).toContain('turn.nexchat.io');
    });
  });
});
