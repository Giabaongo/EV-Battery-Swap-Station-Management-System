import { PartialType } from '@nestjs/mapped-types';
import { CreateVehicleDto } from './create-vehicle.dto';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Vehicle, VehicleStatus } from '@prisma/client';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
    @IsOptional()
    @IsInt()
    user_id?: number | null;

    @IsOptional()
    @IsInt()
    battery_id?: number | null;

    @IsOptional()
    @IsEnum(VehicleStatus)
    status?: VehicleStatus;
}
