import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateBatteryTransferRequestDto } from './create-battery-transfer-request.dto';
import { IsEnum } from 'class-validator';
import { TransferStatus } from '@prisma/client';

export class UpdateBatteryTransferRequestDto extends PartialType(CreateBatteryTransferRequestDto) {
    @ApiProperty({ enum: TransferStatus, description: 'Trạng thái của yêu cầu chuyển pin' })
    @IsEnum(TransferStatus)
    status: TransferStatus;
}
