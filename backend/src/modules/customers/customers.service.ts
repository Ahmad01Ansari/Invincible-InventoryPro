import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from '../../schemas/customer.schema';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CustomersService {
  constructor(@InjectModel(Customer.name) private customerModel: Model<CustomerDocument>) {}

  async create(companyId: string, dto: CreateCustomerDto) {
    return this.customerModel.create({ ...dto, companyId });
  }

  async findAll(companyId: string, query: PaginationDto) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const filter: any = { companyId, isActive: true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.customerModel.find(filter).sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.customerModel.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(companyId: string, id: string) {
    const c = await this.customerModel.findOne({ _id: id, companyId }).lean();
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  async update(companyId: string, id: string, dto: UpdateCustomerDto) {
    const c = await this.customerModel.findOneAndUpdate({ _id: id, companyId }, { $set: dto }, { new: true });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  async remove(companyId: string, id: string) {
    const c = await this.customerModel.findOneAndUpdate({ _id: id, companyId }, { $set: { isActive: false } }, { new: true });
    if (!c) throw new NotFoundException('Customer not found');
    return { message: 'Customer deactivated' };
  }
}
