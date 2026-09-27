import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Post()
  async createGroup(
    @Body()
    body: {
      name: string;
      description?: string;
      avatarUrl?: string;
      isPrivate?: boolean;
      memberUsernames?: string[];
    },
    @Request() req: any,
  ) {
    return this.groupsService.createGroup(req.user.id, body);
  }

  @Get(':chatId')
  async getGroupInfo(@Param('chatId') chatId: string, @Request() req: any) {
    return this.groupsService.getGroupInfo(chatId, req.user.id);
  }

  @Post(':chatId/members')
  async addMember(
    @Param('chatId') chatId: string,
    @Body('username') targetUsername: string,
    @Request() req: any,
  ) {
    return this.groupsService.addMember(chatId, req.user.id, targetUsername);
  }

  @Delete(':chatId/members/:userId')
  async removeMember(
    @Param('chatId') chatId: string,
    @Param('userId') targetUserId: string,
    @Request() req: any,
  ) {
    return this.groupsService.removeMember(chatId, req.user.id, targetUserId);
  }

  @Post('join/:inviteCode')
  async joinByInviteCode(@Param('inviteCode') inviteCode: string, @Request() req: any) {
    return this.groupsService.joinByInviteCode(req.user.id, inviteCode);
  }
}
