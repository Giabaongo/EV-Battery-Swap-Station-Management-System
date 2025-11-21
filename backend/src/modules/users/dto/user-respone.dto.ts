import { OmitType } from '@nestjs/swagger'; // Hoặc @nestjs/mapped-types
import { CreateUserDto } from './create-user.dto';

export class UserResponseDto extends OmitType(CreateUserDto, [
    'password',
    'email_token',
    'email_token_expires',
    'refresh_token',
] as const) {
    // Bạn cũng có thể thêm các trường chỉ có ở response, ví dụ:
    // user_id: number; // Nếu CreateUserDto chưa có
}