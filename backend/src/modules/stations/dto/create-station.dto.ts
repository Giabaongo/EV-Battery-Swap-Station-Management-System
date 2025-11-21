import { ApiProperty } from "@nestjs/swagger";
import { StationStatus } from "@prisma/client";
import { IsDecimal, IsEnum, IsNotEmpty, IsString, Max, MaxLength, Min, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class CreateStationDto {
    @ApiProperty({ description: 'Name of the station', maxLength: 100, example: 'Downtown EV Station' })
    @IsNotEmpty({ message: 'Name is required' })
    @IsString({ message: 'Name must be a string' })
    @MaxLength(100)
    name: string;

    @ApiProperty({ description: 'Address of the station', maxLength: 255, example: '123 Main St, Cityville' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    address: string;

    @IsNotEmpty()
    @IsNumber() // 3. Finally, validates that the result is a number
    @Type(() => Number) // 2. Transforms the incoming string ("10.8793731") to a number
    latitude: number; // 1. The final type we want

    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number) // Same for longitude
    longitude: number;
    
    @ApiProperty({ description: 'Status of the station', example: 'active', enum: StationStatus })
    @IsNotEmpty({ message: 'Status is required' })
    @IsEnum(StationStatus, { message: 'Status must be active, inactive, or maintenance  ' })
    status: StationStatus;
}
