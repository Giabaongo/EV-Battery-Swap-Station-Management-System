import { CabinetStatus } from "@prisma/client";

export class CreateCabinetDto {
    station_id: number;
    cabinet_name: string;
    total_slots: number;
    status: CabinetStatus;
}
