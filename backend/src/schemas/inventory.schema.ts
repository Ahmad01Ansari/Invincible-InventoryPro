import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InventoryDocument = Inventory & Document;

@Schema({ timestamps: true, collection: 'inventory' })
export class Inventory {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true })
  warehouseId: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  quantity: number;

  @Prop()
  batchNumber: string;

  @Prop()
  expiryDate: Date;

  @Prop()
  location: string; // Rack/Bin/Shelf location in warehouse
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);
InventorySchema.index({ companyId: 1, productId: 1, warehouseId: 1 });
