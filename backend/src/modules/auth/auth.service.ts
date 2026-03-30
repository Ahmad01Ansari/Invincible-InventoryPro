import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from '../../schemas/user.schema';
import { Company, CompanyDocument } from '../../schemas/company.schema';
import { RegisterDto, LoginDto, SetupPasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if email already exists
    const existingUser = await this.userModel.findOne({
      email: registerDto.email.toLowerCase(),
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Create company
    const slug = registerDto.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existingCompany = await this.companyModel.findOne({ slug });
    const finalSlug = existingCompany
      ? `${slug}-${Date.now()}`
      : slug;

    const company = await this.companyModel.create({
      name: registerDto.companyName,
      slug: finalSlug,
      industry: registerDto.industry,
      subscriptionPlan: 'free_trial',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      isActive: true,
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // Create owner user
    const user = await this.userModel.create({
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email.toLowerCase(),
      password: hashedPassword,
      phone: registerDto.phone,
      companyId: company._id,
      role: 'company_owner',
      permissions: ['*'], // Full access
      isActive: true,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user, company);

    // Save refresh token
    await this.userModel.findByIdAndUpdate(user._id, {
      refreshToken: tokens.refreshToken,
    });

    return {
      ...tokens,
      user: this.sanitizeUser(user),
      company,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userModel.findOne({
      email: loginDto.email.toLowerCase(),
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated. Contact your admin.');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const company = await this.companyModel.findById(user.companyId);
    if (!company || !company.isActive) {
      throw new UnauthorizedException('Company account is inactive');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user, company);

    // Update refresh token and last login
    await this.userModel.findByIdAndUpdate(user._id, {
      refreshToken: tokens.refreshToken,
      lastLogin: new Date(),
    });

    return {
      ...tokens,
      user: this.sanitizeUser(user),
      company,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.userModel.findById(payload.sub);
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const company = await this.companyModel.findById(user.companyId);
      const tokens = await this.generateTokens(user, company);

      await this.userModel.findByIdAndUpdate(user._id, {
        refreshToken: tokens.refreshToken,
      });

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const company = await this.companyModel.findById(user.companyId);

    return {
      user: this.sanitizeUser(user),
      company,
    };
  }

  async setupPassword(userId: string, dto: SetupPasswordDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    user.password = hashedPassword;
    user.isTemporaryPassword = false;
    await user.save();

    return { message: 'Password successfully updated' };
  }

  private async generateTokens(user: any, company: any) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      companyId: user.companyId.toString(),
      role: user.role,
      isTemporaryPassword: user.isTemporaryPassword || false,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret')!,
        expiresIn: this.configService.get<string>('jwt.expiration') || '15m',
      } as any),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret')!,
        expiresIn: this.configService.get<string>('jwt.refreshExpiration') || '7d',
      } as any),
    ]);

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const userObj = user.toObject ? user.toObject() : user;
    const { password, refreshToken, passwordResetToken, passwordResetExpires, ...sanitized } = userObj;
    return sanitized;
  }
}
