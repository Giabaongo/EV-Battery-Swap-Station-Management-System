import { IsInt, IsNotEmpty } from "class-validator";

export class FindEmptySlotDto {
    @IsNotEmpty({ message: 'user_id is required' })
    @IsInt({ message: 'user_id must be an integer' })
    user_id: number;

    @IsNotEmpty({ message: 'vehicle_id is required' })
    @IsInt({ message: 'vehicle_id must be an integer' })
    vehicle_id: number;

    @IsNotEmpty({ message: 'station_id is required' })
    @IsInt({ message: 'station_id must be an integer' })
    station_id: number;
}
