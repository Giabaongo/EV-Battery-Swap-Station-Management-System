import { IsBoolean, IsInt, isNotEmpty, IsNotEmpty } from "class-validator";


export class UpdateSlotDto {
    @IsNotEmpty()
    @IsInt()
    battery_id: number | null;

    @IsNotEmpty()
    @IsBoolean()
    is_occupied: boolean;
}