import {
  IsEmail,
  IsEnum,
  MinLength,
  IsNotEmpty,
  IsPhoneNumber,
  IsOptional,
  IsString,
  IsDate,
  IsInt,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(2, { message: 'Username must be at least 2 characters' })
  username: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsNotEmpty({ message: 'Phone is required' })
  @IsPhoneNumber('VN', { message: 'Invalid phone number format' })
  phone: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsOptional()
  @IsInt()
  station_id?: number | null;

  @IsOptional()
  @IsString()
  refresh_token?: string | null;

  @IsOptional()
  @IsString()
  email_token?: string | null;

  @IsOptional()
  @IsDate()
  email_token_expires?: Date | null;

  @IsNotEmpty({ message: 'Role is required' })
  @IsEnum(Role, { message: 'Role must be driver, station_staff, or admin' })
  role: Role;
}
