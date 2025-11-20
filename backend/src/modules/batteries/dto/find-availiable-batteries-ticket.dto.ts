import { ApiProperty } from "@nestjs/swagger";
import { BatteryStatus } from "@prisma/client";
import { IsEnum, IsInt, IsNotEmpty, IsPositive, IsString, Min } from "class-validator";

export class findBatteryAvailibleForTicket {
    @ApiProperty({ description: 'Battery model name', example: 'Model X' })
    @IsNotEmpty()
    @IsString()
    model: string;

    @ApiProperty({ description: 'Battery type', example: 'Li-Ion' })
    @IsNotEmpty()
    @IsString()
    type: string;

    @ApiProperty({ description: 'Station ID where to find batteries', example: 1 })
    @IsNotEmpty()
    @IsInt()
    station_id: number;

    @ApiProperty({ description: 'Quantity of batteries needed', example: 2 })
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    quantity: number;
}