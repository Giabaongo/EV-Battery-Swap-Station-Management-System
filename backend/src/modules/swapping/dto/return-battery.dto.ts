import { IsInt, IsNotEmpty } from "class-validator";
import { FindEmptySlotDto } from "./find-empty-slot.dto";

export class ReturnBatteryDto extends FindEmptySlotDto {
    @IsNotEmpty({ message: 'cabinet_id is required' })
    @IsInt({ message: 'cabinet_id must be an integer' })
    cabinet_id: number;

    @IsNotEmpty({ message: 'slot_id is required' })
    @IsInt({ message: 'slot_id must be an integer' })
    slot_id: number;
}