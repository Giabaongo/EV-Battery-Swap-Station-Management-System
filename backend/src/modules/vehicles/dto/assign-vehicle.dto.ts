import { IsInt, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignVehicleDto {
    @ApiProperty({
        description: 'Vehicle Identification Number',
        example: '1HGCM82633A123456',
    })
    @IsNotEmpty()
    @IsString()
    @Length(18, 18, { message: 'VIN must be exactly 18 characters' })
    vin: string;

    @ApiProperty({
        description: 'User ID to assign the vehicle to',
        example: 42,
    })
    @IsNotEmpty()
    @IsInt()
    user_id: number;
}