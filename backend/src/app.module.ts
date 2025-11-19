import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './modules/database/database.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { AuthModule } from './modules/auth/auth.module';
import { StationsModule } from './modules/stations/stations.module';
import { BatteriesModule } from './modules/batteries/batteries.module';
import { BatteryServicePackagesModule } from './modules/battery-service-packages/battery-service-packages.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SwapTransactionsModule } from './modules/swap-transactions/swap-transactions.module';
import { SwappingModule } from './modules/swapping/swapping.module';
import { SupportsModule } from './modules/supports/supports.module';
import { ConfigModule } from '@nestjs/config';
import { BatteryTransferRequestModule } from './modules/battery-transfer-request/battery-transfer-request.module';
import { BatteryTransferTicketModule } from './modules/battery-transfer-ticket/battery-transfer-ticket.module';
import { MailModule } from './modules/mail/mail.module';
import { SystemConfigModule } from './modules/config/config.module';
import { AiModule } from './modules/ai/ai.module';
import { AdminDashboardModule } from './modules/admin-statistics/admin-statistics.module';
import { WebsocketModule } from './modules/websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    UsersModule,
    VehiclesModule,
    AuthModule,
    BatteryServicePackagesModule,
    StationsModule,
    BatteriesModule,
    ReservationsModule,
    SubscriptionsModule,
    SwapTransactionsModule,
    SubscriptionsModule,
    PaymentsModule,
    SwappingModule,
    SupportsModule,
    BatteryTransferRequestModule,
    BatteryTransferTicketModule,
    MailModule,
    SystemConfigModule,
    AiModule,
    AdminDashboardModule,
    WebsocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
