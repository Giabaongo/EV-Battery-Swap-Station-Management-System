import { PartialType } from '@nestjs/mapped-types';
import { CreateBatteryServicePackageDto } from './create-battery-service-package.dto';

export class UpdateBatteryServicePackageDto extends PartialType(CreateBatteryServicePackageDto) {}
