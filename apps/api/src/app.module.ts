import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MenuItemsModule } from './modules/menu-items/menu-items.module';
import { GroupsModule } from './modules/groups/groups.module';
import { WeeklyMenusModule } from './modules/weekly-menus/weekly-menus.module';
import { VotesModule } from './modules/votes/votes.module';
import { OrdersModule } from './modules/orders/orders.module';
import { MessagesModule } from './modules/messages/messages.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { FirebaseModule } from './firebase/firebase.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    MenuItemsModule,
    GroupsModule,
    WeeklyMenusModule,
    VotesModule,
    OrdersModule,
    MessagesModule,
    AnalyticsModule,
    FirebaseModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
