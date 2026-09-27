import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchService } from './search.service';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('global')
  async globalSearch(
    @Request() req: any,
    @Query('q') query: string,
    @Query('type') type?: string,
    @Query('limit') limit = '20',
  ) {
    return this.searchService.globalSearch(req.user.id, query, type, parseInt(limit, 10));
  }
}
