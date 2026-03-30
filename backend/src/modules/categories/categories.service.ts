import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../../schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(@InjectModel(Category.name) private categoryModel: Model<CategoryDocument>) {}

  async create(companyId: string, dto: CreateCategoryDto) {
    return this.categoryModel.create({ ...dto, companyId });
  }

  async findAll(companyId: string) {
    return this.categoryModel.find({ companyId, isActive: true }).sort({ name: 1 }).lean();
  }

  async findOne(companyId: string, id: string) {
    const cat = await this.categoryModel.findOne({ _id: id, companyId }).lean();
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async update(companyId: string, id: string, dto: UpdateCategoryDto) {
    const cat = await this.categoryModel.findOneAndUpdate({ _id: id, companyId }, { $set: dto }, { new: true });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async remove(companyId: string, id: string) {
    const cat = await this.categoryModel.findOneAndUpdate({ _id: id, companyId }, { $set: { isActive: false } }, { new: true });
    if (!cat) throw new NotFoundException('Category not found');
    return { message: 'Category deactivated' };
  }
}
