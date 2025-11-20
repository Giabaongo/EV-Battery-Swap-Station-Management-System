import { IsInt, IsNotEmpty, IsOptional } from "class-validator";
import { SwappingDto } from "./swapping.dto";

export class FirstSwapDto extends SwappingDto {
    @IsInt({ message: 'taken_battery_id must be an integer' })
    @IsNotEmpty({ message: 'taken_battery_id should not be empty' })
    taken_battery_id: number;

    @IsInt({ message: 'subscription_id must be an integer' })
    @IsNotEmpty({ message: 'subscription_id is required' })
    subscription_id: number;
}

