import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GroupsService', () => {
  let service: GroupsService;

  const mockPrisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    chat: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    chatMember: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createGroup', () => {
    it('should create a group chat with owner role', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.chat.create.mockResolvedValue({
        id: 'group-100',
        name: 'Dev Group',
        type: 'GROUP',
        inviteCode: 'abc12345',
      });

      const group = await service.createGroup('usr-owner', {
        name: 'Dev Group',
        description: 'Developer community group',
      });

      expect(group.id).toBe('group-100');
      expect(group.name).toBe('Dev Group');
    });
  });
});
