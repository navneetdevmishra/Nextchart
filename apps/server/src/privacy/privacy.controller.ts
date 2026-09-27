import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrivacyService } from './privacy.service';

@Controller('privacy')
@UseGuards(JwtAuthGuard)
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Post('block')
  async blockUser(@Request() req: any, @Body() body: { blockedId: string }) {
    return this.privacyService.blockUser(req.user.id, body.blockedId);
  }

  @Post('unblock')
  async unblockUser(@Request() req: any, @Body() body: { blockedId: string }) {
    return this.privacyService.unblockUser(req.user.id, body.blockedId);
  }

  @Get('blocked')
  async getBlockedUsers(@Request() req: any) {
    return this.privacyService.getBlockedUsers(req.user.id);
  }

  @Put('settings')
  async updatePrivacySettings(
    @Request() req: any,
    @Body() body: { showLastSeen?: boolean; showReadReceipts?: boolean },
  ) {
    return this.privacyService.updatePrivacySettings(req.user.id, body);
  }

  @Get('sessions')
  async getSessions(@Request() req: any) {
    const refreshToken = req.cookies?.refreshToken;
    return this.privacyService.getActiveSessions(req.user.id, refreshToken);
  }

  @Delete('sessions/:id')
  async revokeSession(@Request() req: any, @Param('id') id: string) {
    return this.privacyService.revokeSession(req.user.id, id);
  }

  @Delete('sessions/other/all')
  async revokeOtherSessions(@Request() req: any) {
    const refreshToken = req.cookies?.refreshToken;
    return this.privacyService.revokeOtherSessions(req.user.id, refreshToken);
  }

  @Post('2fa/setup')
  async setup2FA(@Request() req: any) {
    return this.privacyService.setup2FA(req.user.id);
  }

  @Post('2fa/verify')
  async verify2FA(@Request() req: any, @Body() body: { token: string }) {
    return this.privacyService.verifyAndEnable2FA(req.user.id, body.token);
  }

  @Post('2fa/disable')
  async disable2FA(@Request() req: any, @Body() body: { token: string }) {
    return this.privacyService.disable2FA(req.user.id, body.token);
  }
}
