import { PickType } from "@nestjs/mapped-types";
import { CreateBatteryTransferTicketDto } from "./create-battery-transfer-ticket.dto";

export class findBatteryAvailibleForTransfers extends PickType(
    CreateBatteryTransferTicketDto,
    ['transfer_request_id', 'ticket_type']
) { }