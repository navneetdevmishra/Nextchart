import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const totalUsers = await this.prisma.user.count();
    const onlineUsers = await this.prisma.user.count({ where: { isOnline: true } });
    const suspendedUsers = await this.prisma.user.count({ where: { isSuspended: true } });
    const totalGroups = await this.prisma.group.count();
    const totalChannels = await this.prisma.channel.count();
    const totalCalls = await this.prisma.callSession.count();
    const totalMessages = await this.prisma.message.count();
    const pendingReports = await this.prisma.userReport.count({ where: { status: 'PENDING' } });

    return {
      totalUsers,
      onlineUsers,
      suspendedUsers,
      totalGroups,
      totalChannels,
      totalCalls,
      totalMessages,
      pendingReports,
      systemHealth: 'HEALTHY',
    };
  }

  async getUsers(query?: string, role?: string, isSuspended?: boolean, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (query) {
      where.OR = [
        { username: { contains: query } },
        { email: { contains: query } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isSuspended !== undefined) {
      where.isSuspended = isSuspended;
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isOnline: true,
          isSuspended: true,
          isTwoFactorEnabled: true,
          lastSeen: true,
          createdAt: true,
          _count: {
            select: { messages: true, memberships: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async suspendUser(adminId: string, userId: string, reason?: string, ipAddress?: string) {
    if (adminId === userId) {
      throw new BadRequestException('Cannot suspend your own admin account');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Cannot suspend an administrator account');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isSuspended: true, isOnline: false },
    });

    // Create Audit Log
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'USER_SUSPEND',
        targetType: 'USER',
        targetId: userId,
        details: reason || `Suspended user @${user.username}`,
        ipAddress,
      },
    });

    return updatedUser;
  }

  async reinstateUser(adminId: string, userId: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isSuspended: false },
    });

    // Create Audit Log
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'USER_REINSTATE',
        targetType: 'USER',
        targetId: userId,
        details: `Reinstated user @${user.username}`,
        ipAddress,
      },
    });

    return updatedUser;
  }

  async getReports(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      this.prisma.userReport.findMany({
        where,
        include: {
          reporter: { select: { id: true, username: true, email: true } },
          reportedUser: { select: { id: true, username: true, email: true, isSuspended: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userReport.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async resolveReport(adminId: string, reportId: string, resolution: 'RESOLVED' | 'DISMISSED', ipAddress?: string) {
    const report = await this.prisma.userReport.findUnique({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const updated = await this.prisma.userReport.update({
      where: { id: reportId },
      data: { status: resolution },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: `REPORT_${resolution}`,
        targetType: 'REPORT',
        targetId: reportId,
        details: `Report status updated to ${resolution}`,
        ipAddress,
      },
    });

    return updated;
  }

  async getAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        include: {
          admin: { select: { id: true, username: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count(),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getMetrics() {
    const memoryUsage = process.memoryUsage();
    return {
      uptimeSeconds: Math.floor(process.uptime()),
      memoryAllocatedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      nodeVersion: process.version,
      platform: process.platform,
      database: 'Connected (SQLite/PostgreSQL)',
      timestamp: new Date().toISOString(),
    };
  }
}
