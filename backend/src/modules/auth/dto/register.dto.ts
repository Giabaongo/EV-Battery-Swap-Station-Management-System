import { ApiProperty } from '@nestjs/swagger/dist/decorators/api-property.decorator';
import { IsNotEmpty, IsPhoneNumber, MinLength } from 'class-validator';

export class RegisterDto {

    @ApiProperty({ description: 'Username of the user' })
    @IsNotEmpty({ message: 'Username is required' })
    @MinLength(3, { message: 'Username must be at least 3 characters long' })
    username: string;

    @ApiProperty({ description: 'Email address of the user' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @ApiProperty({ description: 'Phone number of the user' })
    @IsNotEmpty({ message: 'Phone number is required' })
    phone: string;

    @ApiProperty({ description: 'Password of the user' })
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string
}