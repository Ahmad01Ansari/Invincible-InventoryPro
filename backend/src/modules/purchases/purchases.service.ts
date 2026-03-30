import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Purchase, PurchaseDocument } from '../../schemas/purchase.schema';
import { Inventory, InventoryDocument } from '../../schemas/inventory.schema';
import { StockLog, StockLogDocument } from '../../schemas/stock-log.schema';
import { Product, ProductDocument } from '../../schemas/product.schema';
import { CreatePurchaseDto, UpdatePurchaseStatusDto, PurchasePaymentDto } from './dto/purchase.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    @InjectModel(StockLog.name) private stockLogModel: Model<StockLogDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  private generatePONumber(): string {
    const prefix = 'PO';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  async create(companyId: string, userId: string, dto: CreatePurchaseDto) {
    const items = dto.items.map(item => {
      const taxAmount = (item.unitPrice * item.quantity * (item.taxPercentage || 0)) / 100;
      const totalPrice = item.unitPrice * item.quantity + taxAmount;
      return { ...item, taxAmount, totalPrice };
    });

    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const totalTax = items.reduce((s, i) => s + i.taxAmount, 0);
    const totalAmount = subtotal + totalTax;

    return this.purchaseModel.create({
      companyId,
      purchaseNumber: this.generatePONumber(),
      vendorId: dto.vendorId,
      warehouseId: dto.warehouseId,
      items,
      subtotal,
      taxAmount: totalTax,
      totalAmount,
      status: 'pending',
      paymentStatus: 'unpaid',
      paidAmount: 0,
      expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined,
      notes: dto.notes,
      createdBy: userId,
    });
  }

  async findAll(companyId: string, query: PaginationDto & { status?: string }) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const filter: any = { companyId };
    if (query.status) filter.status = query.status;
    if (search) {
      filter.$or = [
        { purchaseNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.purchaseModel.find(filter)
        .populate('vendorId', 'name')
        .populate('warehouseId', 'name')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit).limit(limit).lean(),
      this.purchaseModel.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(companyId: string, id: string) {
    const po = await this.purchaseModel.findOne({ _id: id, companyId })
      .populate('vendorId', 'name email phone')
      .populate('warehouseId', 'name')
      .lean();
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async updateStatus(companyId: string, id: string, userId: string, dto: UpdatePurchaseStatusDto) {
    const po = await this.purchaseModel.findOne({ _id: id, companyId });
    if (!po) throw new NotFoundException('Purchase order not found');

    po.status = dto.status as any;

    if (dto.status === 'approved') {
      po.approvedBy = userId as any;
    }

    if (dto.status === 'received' && po.warehouseId) {
      // Auto stock-in when PO is received
      for (const item of po.items) {
        let inv = await this.inventoryModel.findOne({
          companyId, productId: item.productId, warehouseId: po.warehouseId,
        });
        const prevQty = inv?.quantity || 0;
        if (inv) {
          inv.quantity += item.quantity;
          await inv.save();
        } else {
          inv = await this.inventoryModel.create({
            companyId, productId: item.productId, warehouseId: po.warehouseId,
            quantity: item.quantity,
          });
        }
        // Update product total stock
        const agg = await this.inventoryModel.aggregate([
          { $match: { productId: item.productId } },
          { $group: { _id: null, total: { $sum: '$quantity' } } },
        ]);
        await this.productModel.findByIdAndUpdate(item.productId, {
          currentStock: agg[0]?.total || 0,
        });
        // Log
        await this.stockLogModel.create({
          companyId, productId: item.productId, warehouseId: po.warehouseId,
          type: 'stock_in', quantity: item.quantity,
          previousQuantity: prevQty, newQuantity: prevQty + item.quantity,
          reference: po.purchaseNumber, referenceType: 'purchase',
          performedBy: userId,
        });
      }
      po.receivedDate = new Date();
    }

    await po.save();
    return po;
  }

  async recordPayment(companyId: string, id: string, dto: PurchasePaymentDto) {
    const po = await this.purchaseModel.findOne({ _id: id, companyId });
    if (!po) throw new NotFoundException('Purchase order not found');

    po.paidAmount = (po.paidAmount || 0) + dto.amount;
    if (po.paidAmount >= po.totalAmount) {
      po.paymentStatus = 'paid';
    } else {
      po.paymentStatus = 'partial';
    }
    await po.save();
    return po;
  }

  async getStats(companyId: string) {
    const [totalPOs, pending, totalSpent] = await Promise.all([
      this.purchaseModel.countDocuments({ companyId }),
      this.purchaseModel.countDocuments({ companyId, status: 'pending' }),
      this.purchaseModel.aggregate([
        { $match: { companyId, status: { $in: ['approved', 'received'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);
    return {
      totalPOs,
      pending,
      totalSpent: totalSpent[0]?.total || 0,
    };
  }
}
