import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../../schemas/product.schema';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(companyId: string, dto: CreateProductDto) {
    return this.productModel.create({ ...dto, companyId });
  }

  async findAll(companyId: string, query: PaginationDto) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const filter: any = { companyId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.productModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(companyId: string, id: string) {
    const product = await this.productModel.findOne({ _id: id, companyId }).lean();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(companyId: string, id: string, dto: UpdateProductDto) {
    const product = await this.productModel.findOneAndUpdate(
      { _id: id, companyId },
      { $set: dto },
      { new: true },
    );
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async remove(companyId: string, id: string) {
    const product = await this.productModel.findOneAndUpdate(
      { _id: id, companyId },
      { $set: { isActive: false } },
      { new: true },
    );
    if (!product) throw new NotFoundException('Product not found');
    return { message: 'Product deactivated successfully' };
  }

  async getLowStock(companyId: string) {
    return this.productModel.find({
      companyId,
      isActive: true,
      $expr: { $lte: ['$currentStock', '$minStockLevel'] },
    }).lean();
  }
}
