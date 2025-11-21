import { IsInt, IsNotEmpty, IsPositive, IsString, Min } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CreateBatteryTransferRequestDto {
    @ApiProperty({ example: 'NCM-48V', description: 'Mẫu pin cần chuyển' })
    @IsString()
    @IsNotEmpty()
    battery_model: string;

    @ApiProperty({ example: 'Lithium-ion', description: 'Loại pin cần chuyển' })
    @IsString()
    @IsNotEmpty()
    battery_type: string;

    @ApiProperty({ example: 10, description: 'Số lượng pin cần chuyển' })
    @IsInt()
    @Min(1)
    quantity: number;

    @ApiProperty({ example: 1, description: 'ID trạm nguồn' })
    @IsInt()
    from_station_id: number;

    @ApiProperty({ example: 2, description: 'ID trạm đích' })
    @IsInt()
    to_station_id: number;
}
