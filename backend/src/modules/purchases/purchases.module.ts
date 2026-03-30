import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { Purchase, PurchaseSchema } from '../../schemas/purchase.schema';
import { Inventory, InventorySchema } from '../../schemas/inventory.schema';
import { StockLog, StockLogSchema } from '../../schemas/stock-log.schema';
import { Product, ProductSchema } from '../../schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Purchase.name, schema: PurchaseSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: StockLog.name, schema: StockLogSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
