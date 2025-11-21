import { IsInt, IsNotEmpty, IsOptional } from "class-validator";

export class SwappingDto {
    @IsInt({ message: 'user_id must be an integer' })
    @IsNotEmpty({ message: 'user_id is required' })
    user_id: number;

    @IsNotEmpty({ message: 'vehicle_id is required' })
    @IsInt()
    vehicle_id: number;

    @IsInt({ message: 'station_id must be an integer' })
    @IsNotEmpty({ message: 'station_id is required' })
    station_id: number;

    @IsInt({ message: 'reservation_id must be an integer' })
    @IsOptional()
    reservation_id?: number;
}

