import { ArrayMinSize, IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { TicketType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// DTO con cho mapping battery -> slot (nếu cần manual assign)
export class BatterySlotMappingDto {
    @IsInt()
    battery_id: number;

    @IsInt()
    cabinet_id: number;

    @IsInt()
    slot_id: number;
}

export class CreateBatteryTransferTicketDto {
    @ApiProperty({ type: Number, description: 'ID of the transfer request associated with the ticket', example: 1 })
    @IsNotEmpty()
    @IsInt()
    transfer_request_id: number;

    @ApiProperty({ enum: TicketType, description: 'Type of the ticket', example: TicketType.import })
    @IsNotEmpty()
    @IsEnum(TicketType)
    ticket_type: TicketType;

    @ApiProperty({ type: Number, description: 'ID of the station where the ticket is created', example: 1 })
    @IsNotEmpty()
    @IsInt()
    station_id: number;

    @ApiProperty({ type: Number, description: 'ID of the staff creating the ticket', example: 1 })
    @IsNotEmpty()
    @IsInt()
    staff_id: number;

    @ApiProperty({ type: [Number], description: 'Array of battery IDs to transfer', example: [1, 2, 3] })
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one battery must be selected' })
    @IsInt({ each: true })
    battery_ids: number[];

    // ✅ THÊM: Mapping battery -> slot (nếu staff muốn chọn slot cụ thể)
    @ApiProperty({ 
        type: [BatterySlotMappingDto], 
        description: 'Optional: Manual slot assignment for each battery',
        required: false 
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BatterySlotMappingDto)
    battery_slot_mappings?: BatterySlotMappingDto[];
}
