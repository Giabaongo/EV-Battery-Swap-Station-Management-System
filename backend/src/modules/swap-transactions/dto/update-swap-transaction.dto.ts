import { PartialType } from '@nestjs/mapped-types';
import { CreateSwapTransactionDto } from './create-swap-transaction.dto';
import { SwapTransactionStatus } from '@prisma/client';
import { IsNotEmpty, IsEnum } from 'class-validator';

export class UpdateSwapTransactionDto extends PartialType(CreateSwapTransactionDto) {
    @IsNotEmpty({ message: 'Status should not be empty' })
    @IsEnum(SwapTransactionStatus, { message: 'Status must be one of the following: ' + Object.values(SwapTransactionStatus).join(', ') })
    status: SwapTransactionStatus;
}
