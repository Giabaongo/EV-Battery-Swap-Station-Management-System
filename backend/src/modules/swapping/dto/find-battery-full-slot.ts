import { IsInt, IsNotEmpty, IsOptional } from "class-validator";
import { FindEmptySlotDto } from "./find-empty-slot.dto";

export class FindBatteryFullSlotDto extends FindEmptySlotDto {
    @IsNotEmpty({ message: 'cabinet_id is required' })
    @IsNotEmpty({ message: 'cabinet_id must be an integer' })
    cabinet_id: number;
}
