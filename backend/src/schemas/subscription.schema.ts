import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true, collection: 'subscriptions' })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  companyId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['free_trial', 'basic', 'standard', 'premium'],
  })
  plan: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 3 })
  maxUsers: number;

  @Prop({ default: 100 })
  maxProducts: number;

  @Prop({ default: 1 })
  maxWarehouses: number;

  @Prop({ default: 0 })
  amountPaid: number;

  @Prop()
  paymentId: string;

  @Prop({ default: false })
  autoRenew: boolean;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
