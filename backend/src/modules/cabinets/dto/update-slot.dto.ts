import { IsBoolean, IsInt, isNotEmpty, IsNotEmpty } from "class-validator";


export class UpdateSlotDto {
    @IsNotEmpty()
    @IsBoolean()
    is_occupied: boolean;
}