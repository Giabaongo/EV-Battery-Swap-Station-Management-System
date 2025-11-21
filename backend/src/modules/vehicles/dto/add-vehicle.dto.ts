import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddVehicleDto {
    @ApiProperty({
        description: 'Vehicle Identification Number (VIN)',
        example: 'VINB01789012345678',
        minLength: 18,
        maxLength: 18,
    })
    @IsNotEmpty({ message: 'VIN is required' })
    @IsString()
    @Length(18, 18, { message: 'VIN must be exactly 18 characters' })
    vin: string;
}
