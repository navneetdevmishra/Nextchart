import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: any;

  const mockPrismaService = {
    user: { findMany: jest.fn() },
    chat: { findMany: jest.fn() },
    chatMember: { findMany: jest.fn() },
    message: { findMany: jest.fn() },
    attachment: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return empty results for empty query', async () => {
    const res = await service.globalSearch('user1', '   ');
    expect(res.users).toEqual([]);
    expect(res.messages).toEqual([]);
  });

  it('should perform global search across users, public chats, messages, and attachments', async () => {
    mockPrismaService.user.findMany.mockResolvedValue([{ id: 'u1', username: 'testuser' }]);
    mockPrismaService.chat.findMany.mockResolvedValue([{ id: 'c1', name: 'Test Group' }]);
    mockPrismaService.chatMember.findMany.mockResolvedValue([{ chatId: 'c1' }]);
    mockPrismaService.message.findMany.mockResolvedValue([{ id: 'm1', content: 'test message' }]);
    mockPrismaService.attachment.findMany.mockResolvedValue([]);

    const res = await service.globalSearch('user1', 'test');
    expect(res.users).toHaveLength(1);
    expect(res.chats).toHaveLength(1);
    expect(res.messages).toHaveLength(1);
  });
});
