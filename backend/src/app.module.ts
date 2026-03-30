import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';

import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CustomersModule } from './modules/customers/customers.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { SalesModule } from './modules/sales/sales.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';
import { EmailModule } from './modules/email/email.module';

import { Company, CompanySchema } from './schemas/company.schema';
import { User, UserSchema } from './schemas/user.schema';
import { Role, RoleSchema } from './schemas/role.schema';
import { Product, ProductSchema } from './schemas/product.schema';
import { Category, CategorySchema } from './schemas/category.schema';
import { Customer, CustomerSchema } from './schemas/customer.schema';
import { Vendor, VendorSchema } from './schemas/vendor.schema';
import { Warehouse, WarehouseSchema } from './schemas/warehouse.schema';
import { Inventory, InventorySchema } from './schemas/inventory.schema';
import { StockLog, StockLogSchema } from './schemas/stock-log.schema';
import { Purchase, PurchaseSchema } from './schemas/purchase.schema';
import { Sale, SaleSchema } from './schemas/sale.schema';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import {
  Subscription,
  SubscriptionSchema,
} from './schemas/subscription.schema';
import {
  ActivityLog,
  ActivityLogSchema,
} from './schemas/activity-log.schema';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig],
    }),

    // MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Register all schemas globally
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: Warehouse.name, schema: WarehouseSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: StockLog.name, schema: StockLogSchema },
      { name: Purchase.name, schema: PurchaseSchema },
      { name: Sale.name, schema: SaleSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
    ]),

    // Feature modules
    AuthModule,
    ProductsModule,
    CategoriesModule,
    CustomersModule,
    VendorsModule,
    WarehousesModule,
    InventoryModule,
    PurchasesModule,
    SalesModule,
    DashboardModule,
    ReportsModule,
    SettingsModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
