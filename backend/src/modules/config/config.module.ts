import { Module, Global } from '@nestjs/common';
import { ConfigService } from './config.service';
import { SystemConfigService } from './system-config.service';
import { ConfigController } from './config.controller';
import { DatabaseModule } from '../database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [ConfigController],
  providers: [ConfigService, SystemConfigService],
  exports: [ConfigService, SystemConfigService],
})
export class SystemConfigModule { }
