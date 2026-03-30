import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true, collection: 'companies' })
export class Company {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  slug: string;

  @Prop()
  logo: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop({ type: Object })
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };

  @Prop()
  gstNumber: string;

  @Prop({
    enum: [
      'iron_factory',
      'plastic_factory',
      'warehouse',
      'retail_store',
      'distributor',
      'wholesale',
      'fmcg',
      'manufacturing',
      'other',
    ],
    default: 'other',
  })
  industry: string;

  @Prop({ type: Object, default: {} })
  settings: {
    currency?: string;
    dateFormat?: string;
    timezone?: string;
    brandColor?: string;
    language?: string;
  };

  @Prop({
    enum: ['free_trial', 'basic', 'standard', 'premium'],
    default: 'free_trial',
  })
  subscriptionPlan: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  trialEndsAt: Date;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
