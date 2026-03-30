import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { Sale, SaleSchema } from '../../schemas/sale.schema';
import { Invoice, InvoiceSchema } from '../../schemas/invoice.schema';
import { Inventory, InventorySchema } from '../../schemas/inventory.schema';
import { StockLog, StockLogSchema } from '../../schemas/stock-log.schema';
import { Product, ProductSchema } from '../../schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sale.name, schema: SaleSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: StockLog.name, schema: StockLogSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
