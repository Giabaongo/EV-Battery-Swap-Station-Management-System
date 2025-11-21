import { IsNumber, IsInt, IsNotEmpty, IsOptional, IsNumberString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class findAvailibaleStationsDto {
    @ApiProperty({ example: '1', description: 'User to find stations' })
    @IsNotEmpty()
    @IsInt()
    user_id: number;

    @ApiProperty({ example: '1', description: '' })
    @IsOptional()
    @IsInt()
    vehicle_id?: number;

    @IsOptional()
    @IsNumber() // 3. Finally, validates that the result is a number
    @Type(() => Number) // 2. Transforms the incoming string ("10.8793731") to a number
    latitude?: number; // 1. The final type we want

    @IsOptional()
    @IsNumber()
    @Type(() => Number) // Same for longitude
    longitude?: number;
}