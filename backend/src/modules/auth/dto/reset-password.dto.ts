import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResetPasswordDto {
    @ApiProperty({ description: "Token to validate user for reset password" })
    @IsNotEmpty()
    @IsString()
    token: string;

    @ApiProperty({ example: "newpassword123", description: "User enter new password for login" })
    @IsNotEmpty()
    @IsString()
    new_password: string;
}