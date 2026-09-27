import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CallsService } from './calls.service';

@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post('initiate')
  async initiateCall(@Request() req: any, @Body() body: { receiverId: string; type?: 'VOICE' | 'VIDEO' }) {
    return this.callsService.initiateCall(req.user.id, body.receiverId, body.type);
  }

  @Post(':id/status')
  async updateStatus(@Request() req: any, @Param('id') id: string, @Body() body: { status: string }) {
    return this.callsService.updateCallStatus(id, req.user.id, body.status);
  }

  @Get('history')
  async getHistory(@Request() req: any) {
    return this.callsService.getCallHistory(req.user.id);
  }

  @Get('ice-servers')
  async getIceServers() {
    return this.callsService.getIceServers();
  }
}
