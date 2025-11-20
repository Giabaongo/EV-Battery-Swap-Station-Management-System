import { IsInt, IsNotEmpty } from "class-validator";
import { FindEmptySlotDto } from "./find-empty-slot.dto";
import { ReturnBatteryDto } from "./return-battery.dto";

export class TakeBatteryDto extends ReturnBatteryDto {
    @IsNotEmpty()
    @IsInt()
    taken_battery_id: number
}