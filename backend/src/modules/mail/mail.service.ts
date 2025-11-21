import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: this.configService.get('MAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASSWORD'),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const url = `${this.configService.get('APP_URL')}/auth/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: `"No Reply" <${this.configService.get('MAIL_FROM')}>`,
      to: email,
      subject: 'EV SWAP - Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Email Verification</h2>
          <p>Thank you for registering! Please click the button below to verify your email address:</p>
          <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Verify Email
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p>${url}</p>
          <p>This link will expire in ${this.configService.get('EMAIL_VERIFICATION_TOKEN_EXPIRATION_HOURS')} hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const frontend_url = `${this.configService.get('FRONTEND_RESET_PASSWORD_URL')}?token=${token}`;

    await this.transporter.sendMail({
      from: `"No Reply" <${this.configService.get('MAIL_FROM')}>`,
      to: email,
      subject: 'EV SWAP - Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset</h2>
          <p>You requested a password reset. Please click the button below to reset your password:</p>
          <a href="${frontend_url}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Reset Password
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p>${frontend_url}</p>
          <p>This link will expire in ${this.configService.get('FORGET_PASSWORD_TOKEN_EXPIRATION_MINUTES')} minutes.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
      `,
    });
  }
}