import { Test, TestingModule } from '@nestjs/testing';
import { ChatsService } from './chats.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ChatsService', () => {
  let service: ChatsService;

  const mockPrisma = {
    chatMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    chat: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    message: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ChatsService>(ChatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateDirectChat', () => {
    it('should throw error when trying to chat with self', async () => {
      await expect(service.getOrCreateDirectChat('usr-1', 'usr-1')).rejects.toThrow();
    });

    it('should create new direct chat room if none exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'usr-2' });
      mockPrisma.chat.findFirst.mockResolvedValue(null);
      mockPrisma.chat.create.mockResolvedValue({
        id: 'chat-100',
        type: 'DIRECT',
        updatedAt: new Date(),
        members: [
          { userId: 'usr-1', user: { id: 'usr-1', username: 'user1' } },
          { userId: 'usr-2', user: { id: 'usr-2', username: 'user2' } },
        ],
      });

      const chat = await service.getOrCreateDirectChat('usr-1', 'usr-2');
      expect(chat.id).toBe('chat-100');
    });
  });
});
