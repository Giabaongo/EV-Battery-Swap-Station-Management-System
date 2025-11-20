import { Module } from '@nestjs/common';
import { SupportsService } from './supports.service';
import { SupportsController } from './supports.controller';
import { DatabaseModule } from '../database/database.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [DatabaseModule, WebsocketModule],
  controllers: [SupportsController],
  providers: [SupportsService],
  exports: [SupportsService],
})
export class SupportsModule {}
