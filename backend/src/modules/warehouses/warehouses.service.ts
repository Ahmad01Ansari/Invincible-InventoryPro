import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Warehouse, WarehouseDocument } from '../../schemas/warehouse.schema';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(@InjectModel(Warehouse.name) private warehouseModel: Model<WarehouseDocument>) {}

  async create(companyId: string, dto: CreateWarehouseDto) {
    return this.warehouseModel.create({ ...dto, companyId });
  }

  async findAll(companyId: string) {
    return this.warehouseModel.find({ companyId, isActive: true }).sort({ name: 1 }).lean();
  }

  async findOne(companyId: string, id: string) {
    const w = await this.warehouseModel.findOne({ _id: id, companyId }).lean();
    if (!w) throw new NotFoundException('Warehouse not found');
    return w;
  }

  async update(companyId: string, id: string, dto: UpdateWarehouseDto) {
    const w = await this.warehouseModel.findOneAndUpdate({ _id: id, companyId }, { $set: dto }, { new: true });
    if (!w) throw new NotFoundException('Warehouse not found');
    return w;
  }

  async remove(companyId: string, id: string) {
    const w = await this.warehouseModel.findOneAndUpdate({ _id: id, companyId }, { $set: { isActive: false } }, { new: true });
    if (!w) throw new NotFoundException('Warehouse not found');
    return { message: 'Warehouse deactivated' };
  }
}
