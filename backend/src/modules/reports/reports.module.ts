import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Sale, SaleSchema } from '../../schemas/sale.schema';
import { Purchase, PurchaseSchema } from '../../schemas/purchase.schema';
import { Inventory, InventorySchema } from '../../schemas/inventory.schema';
import { StockLog, StockLogSchema } from '../../schemas/stock-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sale.name, schema: SaleSchema },
      { name: Purchase.name, schema: PurchaseSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: StockLog.name, schema: StockLogSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
