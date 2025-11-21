import { PartialType } from '@nestjs/swagger';
import { CreateBatteryTransferTicketDto } from './create-battery-transfer-ticket.dto';

export class UpdateBatteryTransferTicketDto extends PartialType(CreateBatteryTransferTicketDto) {}
