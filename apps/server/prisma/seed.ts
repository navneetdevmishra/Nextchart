import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding NexChat database...');

  const passwordHash = await argon2.hash('Password123!');

  // User 1: Alex
  const alex = await prisma.user.upsert({
    where: { email: 'alex@nexchat.io' },
    update: {},
    create: {
      email: 'alex@nexchat.io',
      username: 'alex_dev',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      bio: 'Building NexChat architecture 🚀',
      isOnline: true,
      profile: {
        create: {
          customStatus: 'Coding NestJS & Next.js',
          themePreference: 'dark',
        },
      },
    },
  });

  // User 2: Sarah
  const sarah = await prisma.user.upsert({
    where: { email: 'sarah@nexchat.io' },
    update: {},
    create: {
      email: 'sarah@nexchat.io',
      username: 'sarah_m',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
      bio: 'UI/UX Designer & Product Lead',
      isOnline: true,
      profile: {
        create: {
          customStatus: 'Designing NexChat themes',
          themePreference: 'dark',
        },
      },
    },
  });

  // User 3: John
  const john = await prisma.user.upsert({
    where: { email: 'john@nexchat.io' },
    update: {},
    create: {
      email: 'john@nexchat.io',
      username: 'john_tech',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
      bio: 'DevOps & Cloud Engineer',
      isOnline: false,
      profile: {
        create: {
          customStatus: 'Deploying Docker & Redis',
          themePreference: 'dark',
        },
      },
    },
  });

  // Create Direct Chat between Alex & Sarah
  const alexSarahChat = await prisma.chat.create({
    data: {
      type: 'DIRECT',
      isPrivate: true,
      members: {
        create: [
          { userId: alex.id, role: 'MEMBER', isPinned: true },
          { userId: sarah.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Initial Messages
  await prisma.message.createMany({
    data: [
      {
        chatId: alexSarahChat.id,
        senderId: sarah.id,
        content: 'Hey Alex! Welcome to NexChat. Have you checked out the new layout?',
        type: 'TEXT',
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        chatId: alexSarahChat.id,
        senderId: alex.id,
        content: 'Hi Sarah! Yes, the Telegram Web layout with dark theme looks stunning! ⚡',
        type: 'TEXT',
        createdAt: new Date(Date.now() - 1800000),
      },
    ],
  });

  console.log('✅ NexChat database seeded successfully!');
  console.log('User Accounts Created:');
  console.log(' 1. alex@nexchat.io / Password123! (@alex_dev)');
  console.log(' 2. sarah@nexchat.io / Password123! (@sarah_m)');
  console.log(' 3. john@nexchat.io / Password123! (@john_tech)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
