import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('presigned-url')
  async getPresignedUrl(
    @Body('filename') filename: string,
    @Body('fileType') fileType: string,
    @Body('fileSize') fileSize: number,
  ) {
    return this.mediaService.generatePresignedUrl(filename, fileType, fileSize);
  }
}
