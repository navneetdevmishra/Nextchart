import { Body, Controller, Get, Patch, Query, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from '../auth/dto/auth.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('search')
  async searchUsers(@Query('q') query: string, @Request() req: any) {
    return this.usersService.searchUsers(query, req.user.id);
  }

  @Patch('profile')
  async updateProfile(@Body() dto: UpdateProfileDto, @Request() req: any) {
    return this.usersService.updateProfile(req.user.id, dto);
  }
}
