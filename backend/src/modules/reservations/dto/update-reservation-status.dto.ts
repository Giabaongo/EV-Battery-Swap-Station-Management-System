import { PartialType } from '@nestjs/mapped-types';
import { CreateReservationDto } from './create-reservation.dto';
import { IsNotEmpty, IsEnum, IsNumber, IsInt } from 'class-validator';
import { ReservationStatus } from '@prisma/client';

export class UpdateReservationDto extends PartialType(CreateReservationDto) {
    @IsNotEmpty({ message: 'Reservation ID is required' })
    @IsInt({ message: 'Reservation ID must be an integer' })
    reservation_id: number;

    @IsNotEmpty({ message: 'User ID is required' })
    @IsInt({ message: 'User ID must be an integer' })
    user_id?: number;

    @IsNotEmpty({ message: 'Reservation status is required' })
    @IsEnum(ReservationStatus, { message: 'Status must be one of the following: scheduled, completed, cancelled' })
    status: ReservationStatus;
}
