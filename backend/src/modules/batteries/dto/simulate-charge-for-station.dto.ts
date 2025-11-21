import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class SimulateChargeForStationDto {
    @IsNumber()
    @IsNotEmpty()
    station_id: number;

    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    increase_amount?: number;
}