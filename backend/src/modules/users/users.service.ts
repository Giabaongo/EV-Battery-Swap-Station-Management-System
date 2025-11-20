import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { normalizeEmail, normalizePhone } from 'src/common/utils/normalization.util';
import { hashPassword, isMatchPassword } from 'src/common/utils/hash-password.util';
import { $Enums } from '@prisma/client';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) { }

  async create(createUserDto: CreateUserDto) {
    const { username, password, email, phone, role } = createUserDto;

    if (!email || !phone) {
      throw new BadRequestException('Email and phone number are required');
    }

    const normalizedEmail = await normalizeEmail(email);
    const normalizedPhone = await normalizePhone(phone);

    const existingEmailUser = await this.databaseService.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingEmailUser) {
      throw new ConflictException('Email already in use');
    }

    const existingPhoneUser = await this.databaseService.user.findUnique({
      where: { phone: normalizedPhone },
    });
    if (existingPhoneUser) {
      throw new ConflictException('Phone number already in use');
    }

    const hashedPassword = await hashPassword(password);

    let emailVerified = false;

    if (createUserDto.role === $Enums.Role.station_staff) {
      emailVerified = true;
    }

    const newUser = await this.databaseService.user.create({
      data: {
        username,
        password: hashedPassword,
        email: normalizedEmail,
        phone: normalizedPhone,
        email_verified: emailVerified,
        email_token: createUserDto.email_token,
        email_token_expires: createUserDto.email_token_expires,
        role: role,
      },
    });

    return {
      user: {
        user_id: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      }
    }
  }

  async createGoogleUser(data: { email: string; username: string; role: $Enums.Role }) {
    const normalizedEmail = await normalizeEmail(data.email);

    // Check if email already exists
    const existingUser = await this.databaseService.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Generate random phone for Google users (they can update later)
    const randomPhone = `GOOGLE_${Date.now()}`;

    // Create user without password (Google OAuth)
    const newUser = await this.databaseService.user.create({
      data: {
        username: data.username,
        password: '', // Empty password for Google users
        email: normalizedEmail,
        phone: randomPhone,
        role: data.role,
      },
    });

    return newUser;
  }

  async findAll() {
    return await this.databaseService.user.findMany();
  }

  async findOneById(user_id: number) {
    const user = await this.databaseService.user.findUnique({
      where: { user_id }
    });

    if (!user) {
      throw new NotFoundException(`User with ID: ${user_id} not found `);
    }

    return user;
  }

  /**
   * Get user profile without sensitive information
   */
  async getUserProfile(user_id: number) {
    const user = await this.findOneById(user_id);

    // Remove sensitive fields
    const { password, refresh_token, email_token, ...safeUserData } = user;

    return safeUserData;
  }

  async findOneByEmailOrPhone(emailOrPhone: string) {
    const isEmail = emailOrPhone.includes('@');


    if (isEmail) {
      return this.databaseService.user.findUnique({
        where: { email: await normalizeEmail(emailOrPhone) }
      });
    }
    return this.databaseService.user.findUnique({
      where: { phone: await normalizePhone(emailOrPhone) }
    });
  }

  async findOneByEmail(email: string) {
    if (!email) {
      throw new BadRequestException('Email is required!');
    }

    const normalizedEmail = await normalizeEmail(email)

    const user = await this.databaseService.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        user_id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        email_verified: true,
        email_token: true,
        email_token_expires: true,
      }
    });
    return user;
  }

  async findOneByEmailToken(emailToken: string) {
    if (!emailToken) {
      throw new BadRequestException('Email token is required!')
    }

    const user = await this.databaseService.user.findFirst({
      where: { email_token: emailToken }
    });

    if (!user) {
      throw new BadRequestException('Verification token is invalid');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const updatedUser = await this.databaseService.user.update({
      where: { user_id: id },
      data: updateUserDto,
      select: {
        user_id: true,
        username: true,
        email: true,
      }
    });

    return updatedUser;
  }

  async changePassword(user_id: number, dto: ChangePasswordDto) {
    try {
      //validate is user exist
      const user = await this.findOneById(user_id);

      if (dto.old_password === dto.new_password) {
        throw new BadRequestException('Your new password cannot be the same with the current');
      }

      //check is user input correct current password
      const isOldPasswordValid = await isMatchPassword(dto.old_password, user.password);

      if (!isOldPasswordValid) {
        throw new UnauthorizedException('Your old password is incorrect!');
      }

      //hash new password and update to db
      const hashedNewPassword = await hashPassword(dto.new_password);
      const passwordUpdate = {
        password: hashedNewPassword
      }
      await this.update(user.user_id, passwordUpdate);

      return {
        message: 'Change password successfully!'
      }
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number) {
    return "This action removes a #${id} user";
  }
}
