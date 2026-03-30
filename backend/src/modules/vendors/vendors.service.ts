import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vendor, VendorDocument } from '../../schemas/vendor.schema';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class VendorsService {
  constructor(@InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>) {}

  async create(companyId: string, dto: CreateVendorDto) {
    return this.vendorModel.create({ ...dto, companyId });
  }

  async findAll(companyId: string, query: PaginationDto) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const filter: any = { companyId, isActive: true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.vendorModel.find(filter).sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.vendorModel.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(companyId: string, id: string) {
    const v = await this.vendorModel.findOne({ _id: id, companyId }).lean();
    if (!v) throw new NotFoundException('Vendor not found');
    return v;
  }

  async update(companyId: string, id: string, dto: UpdateVendorDto) {
    const v = await this.vendorModel.findOneAndUpdate({ _id: id, companyId }, { $set: dto }, { new: true });
    if (!v) throw new NotFoundException('Vendor not found');
    return v;
  }

  async remove(companyId: string, id: string) {
    const v = await this.vendorModel.findOneAndUpdate({ _id: id, companyId }, { $set: { isActive: false } }, { new: true });
    if (!v) throw new NotFoundException('Vendor not found');
    return { message: 'Vendor deactivated' };
  }
}
