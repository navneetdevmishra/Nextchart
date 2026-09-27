import { Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private channelsService: ChannelsService) {}

  @Post()
  async createChannel(
    @Body()
    body: {
      name: string;
      handle: string;
      description?: string;
      avatarUrl?: string;
      isPrivate?: boolean;
    },
    @Request() req: any,
  ) {
    return this.channelsService.createChannel(req.user.id, body);
  }

  @Get('search')
  async searchChannels(@Query('q') query: string) {
    return this.channelsService.searchChannels(query);
  }

  @Post(':channelId/subscribe')
  async subscribe(@Param('channelId') channelId: string, @Request() req: any) {
    return this.channelsService.subscribe(req.user.id, channelId);
  }

  @Delete(':channelId/unsubscribe')
  async unsubscribe(@Param('channelId') channelId: string, @Request() req: any) {
    return this.channelsService.unsubscribe(req.user.id, channelId);
  }

  @Post(':channelId/posts')
  async publishPost(
    @Param('channelId') channelId: string,
    @Body() postData: { content: string; type?: string; attachments?: any[] },
    @Request() req: any,
  ) {
    return this.channelsService.publishPost(req.user.id, channelId, postData);
  }
}
