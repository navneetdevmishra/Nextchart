import { Test, TestingModule } from '@nestjs/testing';
import { ChannelsService } from './channels.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ChannelsService', () => {
  let service: ChannelsService;

  const mockPrisma = {
    channel: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    chat: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    chatMember: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ChannelsService>(ChannelsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createChannel', () => {
    it('should create a broadcast channel', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue(null);
      mockPrisma.chat.create.mockResolvedValue({
        id: 'channel-1',
        name: 'Tech Updates',
        type: 'CHANNEL',
      });

      const channel = await service.createChannel('owner-1', {
        name: 'Tech Updates',
        handle: 'tech_updates',
      });

      expect(channel.id).toBe('channel-1');
    });
  });
});
