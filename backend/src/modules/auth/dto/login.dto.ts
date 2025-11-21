import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({ description: 'Email address or phone number of the user' })
    @IsNotEmpty({ message: 'Email or phone is required' })
    emailOrPhone: string

    @ApiProperty({ description: 'Password of the user' })
    @IsNotEmpty({ message: 'Password is required' })
    password: string
}