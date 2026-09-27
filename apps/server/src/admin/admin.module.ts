import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [PrismaModule],
  providers: [AdminService, RolesGuard],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
