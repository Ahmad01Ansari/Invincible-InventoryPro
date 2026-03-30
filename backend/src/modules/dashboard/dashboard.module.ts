import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Product, ProductSchema } from '../../schemas/product.schema';
import { Customer, CustomerSchema } from '../../schemas/customer.schema';
import { Vendor, VendorSchema } from '../../schemas/vendor.schema';
import { Sale, SaleSchema } from '../../schemas/sale.schema';
import { Purchase, PurchaseSchema } from '../../schemas/purchase.schema';
import { StockLog, StockLogSchema } from '../../schemas/stock-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: Sale.name, schema: SaleSchema },
      { name: Purchase.name, schema: PurchaseSchema },
      { name: StockLog.name, schema: StockLogSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
