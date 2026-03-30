import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Company, CompanyDocument } from '../../schemas/company.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { UpdateCompanyDto, CreateUserDto, UpdateUserDto } from './dto/settings.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private emailService: EmailService,
  ) {}

  // --- Company Settings ---
  
  async getCompanyProfile(companyId: string) {
    const company = await this.companyModel.findById(companyId).lean();
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async updateCompanyProfile(companyId: string, dto: UpdateCompanyDto) {
    const updated = await this.companyModel.findByIdAndUpdate(
      companyId,
      { $set: dto },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) throw new NotFoundException('Company not found');
    return updated;
  }

  // --- User / Staff Management ---

  async getUsers(companyId: string) {
    const users = await this.userModel.find({ companyId }).select('-password').sort({ createdAt: -1 }).lean();
    return users;
  }

  async createUser(companyId: string, dto: CreateUserDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new BadRequestException('User with this email already exists across the platform');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const company = await this.companyModel.findById(companyId);
    
    const newUser = await this.userModel.create({
      ...dto,
      companyId,
      password: hashedPassword,
      isActive: true,
      isTemporaryPassword: true,
    });

    // Send asynchronous email to new staff member
    if (company) {
      await this.emailService.sendStaffInvitation(dto.email, dto.firstName, dto.password, company.name);
    }

    const userObj: any = newUser.toObject();
    delete userObj.password;
    return userObj;
  }

  async updateUser(companyId: string, userId: string, dto: UpdateUserDto) {
    const updateData: any = { ...dto };
    
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }
    
    // Prevent overriding company owners locally
    const checkTarget = await this.userModel.findOne({ _id: userId, companyId });
    if (!checkTarget) throw new NotFoundException('User not found');
    if (checkTarget.role === 'company_owner' && dto.role && dto.role !== 'company_owner') {
      throw new BadRequestException('Cannot demote a company owner. Transfer ownership first.');
    }

    const updated = await this.userModel.findOneAndUpdate(
      { _id: userId, companyId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password').lean();

    return updated;
  }

  async deleteUser(companyId: string, targetUserId: string, requestingUserId: string) {
    if (targetUserId === requestingUserId) throw new BadRequestException('You cannot delete your own account');
    
    const target = await this.userModel.findOne({ _id: targetUserId, companyId });
    if (!target) throw new NotFoundException('User not found');
    if (target.role === 'company_owner') throw new BadRequestException('Company owners cannot be deleted');

    await this.userModel.deleteOne({ _id: targetUserId, companyId });
    return { message: 'Staff member deleted successfully' };
  }
}
