import { BadRequestException, Injectable, NotFoundException, NotImplementedException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { hashPassword, isMatchPassword } from 'src/common/utils/hash-password.util';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role, StationStatus, UserStatus } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { stat } from 'fs';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService, private jwtService: JwtService,
        private mailService: MailService,
        private configService: ConfigService,
    ) { }

    async login(loginDto: LoginDto) {
        const user = await this.usersService.findOneByEmailOrPhone(loginDto.emailOrPhone);

        if (user?.status !== UserStatus.active) {
            throw new UnauthorizedException('Your account has been banned!. Please contact our support service.'); 
        }

        if (!user || !(await isMatchPassword(loginDto.password, user.password))) {
            throw new UnauthorizedException('Your email/phone or password is incorrect!');
        }

        if (!user.email_verified) {
            throw new UnauthorizedException('Email not verified, please verify your email before logging in');
        }

        const tokenPayload = {
            sub: user.user_id,
            email: user.email,
            phone: user.phone,
            username: user.username,
            role: user.role,
        }

        const accessToken = await this.jwtService.signAsync(tokenPayload);
        const refreshToken = {
            refresh_token: await this.jwtService.signAsync(tokenPayload, {
                secret: process.env.JWT_REFRESH_TOKEN_SECRET,
                expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME,
            })
        }

        //TODO: save refreshToken to db
        this.usersService.update(user.user_id, refreshToken);

        return {
            accessToken,
            refreshToken,
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: user.role,
                station_id: user.station_id,
            }
        }
    }

    async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
        const payload = await this.jwtService.verifyAsync(refreshToken, {
            secret: process.env.JWT_REFRESH_TOKEN_SECRET,
        });

        const user = await this.usersService.findOneById(payload.sub);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const newTokenPayload = {
            sub: user.user_id,
            name: user.username,
            email: user.email,
            phone: user.phone,
            role: user.role,
            station_id: user.station_id,
        };

        const newAccessToken = await this.jwtService.signAsync(newTokenPayload, {
            secret: process.env.JWT_SECRET,
            expiresIn: process.env.JWT_EXPIRES_IN,
        });

        return { accessToken: newAccessToken };
    }

    async register(dto: RegisterDto) {
        const emailToken = crypto.randomBytes(32).toString('hex');
        const emailTokenExpires = new Date();
        const expireHours = this.configService.get<number>('EMAIL_VERIFICATION_TOKEN_EXPIRATION_HOURS') || 24;
        emailTokenExpires.setHours(emailTokenExpires.getHours() + expireHours); // 24 hours

        const newUser = await this.usersService.create({
            username: dto.username,
            password: dto.password,
            email: dto.email,
            phone: dto.phone,
            email_token: emailToken,
            email_token_expires: emailTokenExpires,
            role: Role.driver,
        });

        await this.mailService.sendVerificationEmail(newUser.user.email, emailToken);

        return {
            message: 'Registration successful. Please check your email to verify your account.',
            user: {
                user_id: newUser.user.user_id,
                username: newUser.user.username,
                email: newUser.user.email,
                phone: newUser.user.phone,
                role: newUser.user.role,
            }
        };
    }

    async logout(userId: number) {
        const refreshTokenUpdate = {
            refresh_token: null
        };
        await this.usersService.update(userId, refreshTokenUpdate);
        return {
            message: 'Logout successful',
        };
    }

    async googleLogin(googleUser: any) {
        if (!googleUser) {
            throw new UnauthorizedException('No user from Google');
        }

        // Tìm user theo email
        let user = await this.usersService.findOneByEmail(googleUser.email);

        // Nếu user chưa tồn tại, tạo mới
        if (!user) {
            user = await this.usersService.createGoogleUser({
                email: googleUser.email,
                username: googleUser.firstName + ' ' + googleUser.lastName,
                role: Role.driver,
            });
        }

        // Tạo token
        const tokenPayload = {
            sub: user.user_id,
            email: user.email,
            phone: user.phone,
            username: user.username,
            role: user.role,
        };

        const accessToken = await this.jwtService.signAsync(tokenPayload);
        const refreshToken = {
            refresh_token: await this.jwtService.signAsync(tokenPayload, {
                secret: process.env.JWT_REFRESH_TOKEN_SECRET,
                expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME,
            })
        }

        // Save refreshToken to db
        await this.usersService.update(user.user_id, refreshToken);

        return {
            accessToken,
            refreshToken,
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: user.role,
            }
        };
    }

    async verifyEmail(token: string) {
        const user = await this.usersService.findOneByEmailToken(token);


        if (user.email_token_expires && user.email_token_expires < new Date()) {
            throw new BadRequestException('Verification token has expired');
        }

        if (user.email_verified) {
            throw new BadRequestException('Email has already been verified');
        }

        const updateVerifyUser = {
            email_verified: true,
            email_token: null,
            email_token_expires: null
        }

        const verifiedUser = await this.usersService.update(user.user_id, updateVerifyUser);

        return {
            message: 'Email verification successful',
            user: verifiedUser
        };
    }

    async resendVerificationEmail(email: string) {
        const user = await this.usersService.findOneByEmail(email);

        if (!user) {
            throw new NotFoundException(`User with email: ${email} not found `);
        }

        if (user.email_verified) {
            throw new BadRequestException('Email is already verified');
        }

        // Generate new token
        const emailToken = crypto.randomBytes(32).toString('hex');
        const emailTokenExpires = new Date();
        const expireHours = this.configService.get<number>('EMAIL_VERIFICATION_TOKEN_EXPIRATION_HOURS') || 24;
        emailTokenExpires.setHours(emailTokenExpires.getHours() + expireHours);

        // Update user with new token

        // Send email
        await this.mailService.sendVerificationEmail(email, emailToken);

        return {
            message: 'Verification email resent. Please check your email.',
        };
    }

    // User request an email to reset password
    async forgetPassword(email: string) {
        try {
            if (!email) {
                throw new BadRequestException('Email is required!');
            }

            const user = await this.usersService.findOneByEmail(email);

            if (!user) {
                throw new NotFoundException(`User with email: ${email} not found`);
            }

            if (!user.email_verified && user.email_verified === false) {
                throw new BadRequestException('Email not verified. Cannot reset password.');
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpires = new Date();
            const expireMinutes = this.configService.get<number>('FORGET_PASSWORD_TOKEN_EXPIRATION_MINUTES') || 15;
            resetTokenExpires.setHours(resetTokenExpires.getMinutes() + expireMinutes);

            const updateEmailToken = {
                email_token: resetToken,
                email_token_expires: resetTokenExpires
            }

            // Update user with reset token
            await this.usersService.update(user.user_id, updateEmailToken);

            await this.mailService.sendPasswordResetEmail(email, resetToken);

            return {
                message: 'Password reset email sent. Please check your email.',
            };
        } catch (error) {
            throw error;
        }
    }

    async resetPassword(dto: ResetPasswordDto) {
        try {
            const user = await this.usersService.findOneByEmailToken(dto.token);

            if (user.email_token_expires && user.email_token_expires < new Date()) {
                throw new BadRequestException('Password reset token has expired');
            }

            const hashedPassword = {
                password: await hashPassword(dto.new_password)
            }

            await this.usersService.update(user.user_id, hashedPassword);

            //detele email_token after reset password
            const updateEmailToken = {
                email_token: null,
                email_token_expires: null
            }

            await this.usersService.update(user.user_id, updateEmailToken);

            return {
                message: 'Password has been reset successfully',
            }
        } catch (error) {
            throw error;
        }
    }
}