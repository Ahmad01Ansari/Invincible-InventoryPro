import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StockLogDocument = StockLog & Document;

@Schema({ timestamps: true, collection: 'stock_logs' })
export class StockLog {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Warehouse' })
  warehouseId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['stock_in', 'stock_out', 'adjustment', 'transfer', 'damaged', 'return'],
  })
  type: string;

  @Prop({ required: true })
  quantity: number;

  @Prop()
  previousQuantity: number;

  @Prop()
  newQuantity: number;

  @Prop()
  reference: string; // PO number, Sale number, etc.

  @Prop()
  referenceType: string; // 'purchase', 'sale', 'manual'

  @Prop()
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  performedBy: Types.ObjectId;

  // For transfers
  @Prop({ type: Types.ObjectId, ref: 'Warehouse' })
  fromWarehouseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Warehouse' })
  toWarehouseId: Types.ObjectId;
}

export const StockLogSchema = SchemaFactory.createForClass(StockLog);
StockLogSchema.index({ companyId: 1, productId: 1 });
StockLogSchema.index({ companyId: 1, createdAt: -1 });
