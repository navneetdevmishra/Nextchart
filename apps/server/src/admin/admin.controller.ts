import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  async getUsers(
    @Query('query') query?: string,
    @Query('role') role?: string,
    @Query('isSuspended') isSuspended?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const suspendedBool = isSuspended !== undefined ? isSuspended === 'true' : undefined;
    return this.adminService.getUsers(query, role, suspendedBool, parseInt(page, 10), parseInt(limit, 10));
  }

  @Post('users/:id/suspend')
  async suspendUser(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.adminService.suspendUser(req.user.id, id, body.reason, req.ip);
  }

  @Post('users/:id/reinstate')
  async reinstateUser(@Request() req: any, @Param('id') id: string) {
    return this.adminService.reinstateUser(req.user.id, id, req.ip);
  }

  @Get('reports')
  async getReports(
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.adminService.getReports(status, parseInt(page, 10), parseInt(limit, 10));
  }

  @Post('reports/:id/resolve')
  async resolveReport(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { resolution: 'RESOLVED' | 'DISMISSED' },
  ) {
    return this.adminService.resolveReport(req.user.id, id, body.resolution, req.ip);
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.adminService.getAuditLogs(parseInt(page, 10), parseInt(limit, 10));
  }

  @Get('metrics')
  async getMetrics() {
    return this.adminService.getMetrics();
  }
}
