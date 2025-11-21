import { IsInt, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
    @ApiProperty({ example: 'oldPassword123', description: 'The current password of the user' })
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    old_password: string;

    @ApiProperty({ example: 'newPassword123', description: 'The new password to set for the user' })
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    new_password: string;
}