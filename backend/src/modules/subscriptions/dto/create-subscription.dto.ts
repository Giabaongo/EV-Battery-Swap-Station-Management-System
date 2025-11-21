import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'ID of the user subscribing' })
  @IsInt()
  @IsNotEmpty()
  user_id: number;

  @ApiProperty({ description: 'ID of the subscription package' })
  @IsInt()
  @IsNotEmpty()
  package_id: number;

  @ApiProperty({ description: 'ID of the vehicle associated with the subscription' })
  @IsNotEmpty()
  @IsInt()
  vehicle_id: number;
}

