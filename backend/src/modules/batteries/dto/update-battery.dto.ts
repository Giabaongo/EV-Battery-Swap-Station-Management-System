import { PartialType } from '@nestjs/mapped-types';
import { CreateBatteryDto } from './create-battery.dto';
import { BatteryStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateBatteryDto extends PartialType(CreateBatteryDto) {
}
