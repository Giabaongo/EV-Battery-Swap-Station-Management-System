import { IsInt, IsNotEmpty, IsOptional } from "class-validator";
import { FindEmptySlotDto } from "./find-empty-slot.dto";

export class FindBatteryFullSlotDto extends FindEmptySlotDto {
    @IsNotEmpty({ message: 'cabinet_id is required' })
    @IsNumber({ message: 'cabinet_id must be an integer' })
    cabinet_id: number;
}
