import { IsInt, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { SwapTransactionStatus } from '@prisma/client';

export class CreateSwapTransactionDto {
    @IsInt({ message: 'user_id must be an integer' })
    @IsNotEmpty({ message: 'user_id should not be empty' })
    user_id: number;

    @IsInt({ message: 'vehicle_id must be an integer' })
    @IsNotEmpty({ message: 'vehicle_id should not be empty' })
    vehicle_id: number;

    @IsInt({ message: 'station_id must be an integer' })
    @IsNotEmpty({ message: 'station_id should not be empty' })
    station_id: number;

    @IsInt({ message: 'cabinet_id must be an integer' })
    @IsNotEmpty({ message: 'cabinet_id should not be empty' })
    cabinet_id: number;

    @IsInt({ message: 'battery_returned_id must be an integer' })
    @IsOptional()
    battery_returned_id: number;

    @IsInt({ message: 'subscription_id must be an integer' })
    @IsNotEmpty({ message: 'subscription_id should not be empty' })
    subscription_id: number;

    @IsNotEmpty({ message: 'status should not be empty' })
    @IsEnum(SwapTransactionStatus, { message: 'status must be a valid SwapTransactionStatus' })
    status: SwapTransactionStatus;
}

