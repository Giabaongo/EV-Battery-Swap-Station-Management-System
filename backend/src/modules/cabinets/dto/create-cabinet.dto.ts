import { CabinetStatus } from "@prisma/client";
import { IsEnum, IsInt, IsNotEmpty } from "class-validator";

export class CreateCabinetDto {
    @IsNotEmpty()
    @IsInt()
    station_id: number;

    @IsNotEmpty()
    @IsInt()
    cabinet_name: string;

    @IsNotEmpty()
    @IsInt()
    total_slots: number;

    @IsNotEmpty()
    @IsEnum(CabinetStatus)
    status: CabinetStatus;
}
