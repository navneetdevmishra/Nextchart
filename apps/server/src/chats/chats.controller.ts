import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  @Get()
  async getUserChats(@Request() req: any) {
    return this.chatsService.getUserChats(req.user.id);
  }

  @Post('direct')
  async getOrCreateDirectChat(@Body('recipientId') recipientId: string, @Request() req: any) {
    return this.chatsService.getOrCreateDirectChat(req.user.id, recipientId);
  }

  @Get(':chatId/messages')
  async getChatMessages(
    @Param('chatId') chatId: string,
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
    @Request() req: any,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.chatsService.getChatMessages(chatId, req.user.id, cursor, parsedLimit);
  }

  @Patch(':chatId/settings')
  async updateMemberSettings(
    @Param('chatId') chatId: string,
    @Body() settings: { isPinned?: boolean; isMuted?: boolean; isArchived?: boolean },
    @Request() req: any,
  ) {
    return this.chatsService.updateMemberSettings(req.user.id, chatId, settings);
  }

  @Post(':chatId/forward')
  async forwardMessages(
    @Param('chatId') targetChatId: string,
    @Body('messageIds') messageIds: string[],
    @Request() req: any,
  ) {
    return this.chatsService.forwardMessages(req.user.id, targetChatId, messageIds);
  }
}
