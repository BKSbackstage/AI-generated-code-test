import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { User, UserRole } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get('GOOGLE_CLIENT_ID'),
    );
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);
    const verificationToken = uuidv4();

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      emailVerificationToken: verificationToken,
    });

    await this.mailService.sendVerificationEmail(user.email, verificationToken);

    return {
      message: 'Registration successful. Please verify your email.',
      userId: user.id,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    return this.generateTokens(user);
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersService.findById(payload.sub);
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If this email exists, a reset link has been sent.' };
    }

    const resetToken = uuidv4();
    const resetExpiry = new Date(Date.now() + 3600000); // 1 hour

    await this.usersService.setPasswordResetToken(user.id, resetToken, resetExpiry);
    await this.mailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If this email exists, a reset link has been sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(resetPasswordDto.token);
    if (!user || user.passwordResetExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 12);
    await this.usersService.updatePassword(user.id, hashedPassword);
    await this.mailService.sendPasswordChangedEmail(user.email);

    return { message: 'Password reset successfully' };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.usersService.markEmailVerified(user.id);
    return { message: 'Email verified successfully' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    const isValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashed = await bcrypt.hash(changePasswordDto.newPassword, 12);
    await this.usersService.updatePassword(userId, hashed);
    return { message: 'Password changed successfully' };
  }

  async logout(userId: string) {
    await this.usersService.clearRefreshToken(userId);
    return { message: 'Logged out successfully' };
  }

  async googleAuth(idToken: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: this.configService.get('GOOGLE_CLIENT_ID'),
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new UnauthorizedException('Invalid Google token');
    }

    let user = await this.usersService.findByEmail(payload.email);
    if (!user) {
      user = await this.usersService.create({
        email: payload.email,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        password: await bcrypt.hash(uuidv4(), 12),
        isEmailVerified: true,
        googleId: payload.sub,
        avatar: payload.picture,
      });
    }

    return this.generateTokens(user);
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRY', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRY', '7d'),
    });

    await this.usersService.saveRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }
}
