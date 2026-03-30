import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  companyId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  sku: string;

  @Prop()
  barcode: string;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ min: 0, default: 0 })
  costPrice: number;

  @Prop({ default: 0 })
  taxPercentage: number;

  @Prop({ default: 'piece' })
  unit: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: 10 })
  minStockLevel: number;

  @Prop({ default: 20 })
  reorderThreshold: number;

  @Prop({ type: Object })
  variants: Record<string, any>;

  @Prop({ default: 0 })
  currentStock: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ companyId: 1, sku: 1 }, { unique: true });
ProductSchema.index({ companyId: 1, name: 'text' });
