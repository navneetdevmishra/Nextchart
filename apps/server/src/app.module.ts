import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChatsModule } from './chats/chats.module';
import { MediaModule } from './media/media.module';
import { GroupsModule } from './groups/groups.module';
import { ChannelsModule } from './channels/channels.module';
import { CallsModule } from './calls/calls.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrivacyModule } from './privacy/privacy.module';
import { AdminModule } from './admin/admin.module';
import { SearchModule } from './search/search.module';
import { EventsGateway } from './gateway/events.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    JwtModule.register({}),
    PrismaModule,
    AuthModule,
    UsersModule,
    ChatsModule,
    MediaModule,
    GroupsModule,
    ChannelsModule,
    CallsModule,
    NotificationsModule,
    PrivacyModule,
    AdminModule,
    SearchModule,
  ],
  providers: [EventsGateway],
})
export class AppModule {}
