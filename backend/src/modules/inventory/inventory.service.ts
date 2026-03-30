import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inventory, InventoryDocument } from '../../schemas/inventory.schema';
import { StockLog, StockLogDocument } from '../../schemas/stock-log.schema';
import { Product, ProductDocument } from '../../schemas/product.schema';
import { StockInDto, StockOutDto, StockAdjustDto, StockTransferDto } from './dto/inventory.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    @InjectModel(StockLog.name) private stockLogModel: Model<StockLogDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async getStock(companyId: string, query: PaginationDto) {
    const { page = 1, limit = 20, search } = query;
    const filter: any = { companyId };

    const [data, total] = await Promise.all([
      this.inventoryModel
        .find(filter)
        .populate('productId', 'name sku price unit currentStock minStockLevel')
        .populate('warehouseId', 'name')
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.inventoryModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async stockIn(companyId: string, userId: string, dto: StockInDto) {
    // Find or create inventory record
    let inventory = await this.inventoryModel.findOne({
      companyId, productId: dto.productId, warehouseId: dto.warehouseId,
    });

    const previousQty = inventory?.quantity || 0;
    const newQty = previousQty + dto.quantity;

    if (inventory) {
      inventory.quantity = newQty;
      if (dto.batchNumber) inventory.batchNumber = dto.batchNumber;
      await inventory.save();
    } else {
      inventory = await this.inventoryModel.create({
        companyId, productId: dto.productId, warehouseId: dto.warehouseId,
        quantity: dto.quantity, batchNumber: dto.batchNumber,
      });
    }

    // Update product total stock
    await this.updateProductStock(companyId, dto.productId);

    // Create stock log
    await this.stockLogModel.create({
      companyId, productId: dto.productId, warehouseId: dto.warehouseId,
      type: 'stock_in', quantity: dto.quantity,
      previousQuantity: previousQty, newQuantity: newQty,
      reference: dto.reference, referenceType: 'manual',
      notes: dto.notes, performedBy: userId,
    });

    return inventory;
  }

  async stockOut(companyId: string, userId: string, dto: StockOutDto) {
    const inventory = await this.inventoryModel.findOne({
      companyId, productId: dto.productId, warehouseId: dto.warehouseId,
    });

    if (!inventory || inventory.quantity < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const previousQty = inventory.quantity;
    inventory.quantity -= dto.quantity;
    await inventory.save();

    await this.updateProductStock(companyId, dto.productId);

    await this.stockLogModel.create({
      companyId, productId: dto.productId, warehouseId: dto.warehouseId,
      type: 'stock_out', quantity: dto.quantity,
      previousQuantity: previousQty, newQuantity: inventory.quantity,
      reference: dto.reference, referenceType: 'manual',
      notes: dto.notes, performedBy: userId,
    });

    return inventory;
  }

  async stockAdjust(companyId: string, userId: string, dto: StockAdjustDto) {
    let inventory = await this.inventoryModel.findOne({
      companyId, productId: dto.productId, warehouseId: dto.warehouseId,
    });

    const previousQty = inventory?.quantity || 0;

    if (inventory) {
      inventory.quantity = dto.newQuantity;
      await inventory.save();
    } else {
      inventory = await this.inventoryModel.create({
        companyId, productId: dto.productId, warehouseId: dto.warehouseId,
        quantity: dto.newQuantity,
      });
    }

    await this.updateProductStock(companyId, dto.productId);

    await this.stockLogModel.create({
      companyId, productId: dto.productId, warehouseId: dto.warehouseId,
      type: 'adjustment', quantity: Math.abs(dto.newQuantity - previousQty),
      previousQuantity: previousQty, newQuantity: dto.newQuantity,
      notes: dto.reason, performedBy: userId,
    });

    return inventory;
  }

  async stockTransfer(companyId: string, userId: string, dto: StockTransferDto) {
    // Stock out from source warehouse
    const sourceInventory = await this.inventoryModel.findOne({
      companyId, productId: dto.productId, warehouseId: dto.fromWarehouseId,
    });

    if (!sourceInventory || sourceInventory.quantity < dto.quantity) {
      throw new BadRequestException('Insufficient stock in source warehouse');
    }

    sourceInventory.quantity -= dto.quantity;
    await sourceInventory.save();

    // Stock in to destination warehouse
    let destInventory = await this.inventoryModel.findOne({
      companyId, productId: dto.productId, warehouseId: dto.toWarehouseId,
    });

    if (destInventory) {
      destInventory.quantity += dto.quantity;
      await destInventory.save();
    } else {
      destInventory = await this.inventoryModel.create({
        companyId, productId: dto.productId, warehouseId: dto.toWarehouseId,
        quantity: dto.quantity,
      });
    }

    // Log the transfer
    await this.stockLogModel.create({
      companyId, productId: dto.productId,
      type: 'transfer', quantity: dto.quantity,
      fromWarehouseId: dto.fromWarehouseId, toWarehouseId: dto.toWarehouseId,
      notes: dto.notes, performedBy: userId,
    });

    return { source: sourceInventory, destination: destInventory };
  }

  async getStockLogs(companyId: string, query: PaginationDto & { productId?: string }) {
    const { page = 1, limit = 20 } = query;
    const filter: any = { companyId };
    if (query.productId) filter.productId = query.productId;

    const [data, total] = await Promise.all([
      this.stockLogModel
        .find(filter)
        .populate('productId', 'name sku')
        .populate('warehouseId', 'name')
        .populate('performedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.stockLogModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private async updateProductStock(companyId: string, productId: string) {
    const result = await this.inventoryModel.aggregate([
      { $match: { companyId, productId } },
      { $group: { _id: null, totalStock: { $sum: '$quantity' } } },
    ]);
    const totalStock = result[0]?.totalStock || 0;
    await this.productModel.findByIdAndUpdate(productId, { currentStock: totalStock });
  }
}
