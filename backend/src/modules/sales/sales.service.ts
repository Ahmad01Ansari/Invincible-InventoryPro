import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sale, SaleDocument } from '../../schemas/sale.schema';
import { Invoice, InvoiceDocument } from '../../schemas/invoice.schema';
import { Inventory, InventoryDocument } from '../../schemas/inventory.schema';
import { StockLog, StockLogDocument } from '../../schemas/stock-log.schema';
import { Product, ProductDocument } from '../../schemas/product.schema';
import { CreateSaleDto, SalePaymentDto } from './dto/sale.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    @InjectModel(StockLog.name) private stockLogModel: Model<StockLogDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  private generateNumber(prefix: string): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${ts}-${rand}`;
  }

  async create(companyId: string, userId: string, dto: CreateSaleDto) {
    // Calculate item totals
    const items = dto.items.map(item => {
      const discountAmt = item.discount || 0;
      const subtotal = item.unitPrice * item.quantity - discountAmt;
      const taxAmount = (subtotal * (item.taxPercentage || 0)) / 100;
      const totalPrice = subtotal + taxAmount;
      return { ...item, discount: discountAmt, taxAmount, totalPrice };
    });

    const subtotal = items.reduce((s, i) => s + (i.unitPrice * i.quantity - (i.discount || 0)), 0);
    const totalTax = items.reduce((s, i) => s + i.taxAmount, 0);
    const totalDiscount = items.reduce((s, i) => s + (i.discount || 0), 0);
    const totalAmount = subtotal + totalTax;

    // Deduct stock if warehouse specified
    if (dto.warehouseId) {
      for (const item of items) {
        const inv = await this.inventoryModel.findOne({
          companyId, productId: item.productId, warehouseId: dto.warehouseId,
        });
        if (!inv || inv.quantity < item.quantity) {
          throw new BadRequestException(`Insufficient stock for ${item.productName}`);
        }
        const prevQty = inv.quantity;
        inv.quantity -= item.quantity;
        await inv.save();

        // Update product total
        const agg = await this.inventoryModel.aggregate([
          { $match: { productId: item.productId } },
          { $group: { _id: null, total: { $sum: '$quantity' } } },
        ]);
        await this.productModel.findByIdAndUpdate(item.productId, {
          currentStock: agg[0]?.total || 0,
        });

        await this.stockLogModel.create({
          companyId, productId: item.productId, warehouseId: dto.warehouseId,
          type: 'stock_out', quantity: item.quantity,
          previousQuantity: prevQty, newQuantity: inv.quantity,
          referenceType: 'sale', performedBy: userId,
        });
      }
    }

    const isPaidUpfront = !!dto.paymentMethod && dto.paymentMethod !== 'pending';

    // Create sale
    const sale = await this.saleModel.create({
      companyId,
      saleNumber: this.generateNumber('SL'),
      customerId: dto.customerId,
      warehouseId: dto.warehouseId,
      items,
      subtotal,
      discount: totalDiscount,
      taxAmount: totalTax,
      totalAmount,
      status: 'confirmed',
      paymentStatus: isPaidUpfront ? 'paid' : 'unpaid',
      paidAmount: isPaidUpfront ? totalAmount : 0,
      notes: dto.notes,
      createdBy: userId,
    });

    // Auto-generate invoice
    const invoiceNumber = this.generateNumber('INV');
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = await this.invoiceModel.create({
      companyId,
      invoiceNumber,
      type: 'sale',
      referenceId: sale._id as any,
      items: items.map(i => ({
        description: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxPercentage: i.taxPercentage || 0,
        taxAmount: i.taxAmount,
        totalPrice: i.totalPrice,
      })),
      subtotal,
      taxDetails: { cgst: 0, sgst: 0, igst: 0, totalTax },
      totalAmount,
      status: isPaidUpfront ? 'paid' : 'sent',
      dueDate,
      ...(isPaidUpfront && { paidDate: new Date() }),
    });

    return { sale, invoice };
  }

  async findAll(companyId: string, query: PaginationDto & { status?: string }) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const filter: any = { companyId };
    if (query.status) filter.status = query.status;
    if (search) {
      filter.$or = [{ saleNumber: { $regex: search, $options: 'i' } }];
    }

    const [data, total] = await Promise.all([
      this.saleModel.find(filter)
        .populate('customerId', 'name email')
        .populate('warehouseId', 'name')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit).limit(limit).lean(),
      this.saleModel.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(companyId: string, id: string) {
    const sale = await this.saleModel.findOne({ _id: id, companyId })
      .populate('customerId', 'name email phone gstNumber')
      .populate('warehouseId', 'name')
      .lean();
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  async getInvoice(companyId: string, invoiceId: string) {
    const invoice = await this.invoiceModel.findOne({ _id: invoiceId, companyId })
      .populate('customerId', 'name email phone address gstNumber')
      .lean();
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async recordPayment(companyId: string, id: string, dto: SalePaymentDto) {
    const sale = await this.saleModel.findOne({ _id: id, companyId });
    if (!sale) throw new NotFoundException('Sale not found');

    sale.paidAmount = (sale.paidAmount || 0) + dto.amount;
    sale.paymentStatus = sale.paidAmount >= sale.totalAmount ? 'paid' : 'partial';
    await sale.save();

    // Update invoice
    await this.invoiceModel.findOneAndUpdate(
      { referenceId: id, companyId },
      {
        status: sale.paymentStatus === 'paid' ? 'paid' : 'sent',
        paidDate: sale.paymentStatus === 'paid' ? new Date() : undefined,
      }
    );

    return sale;
  }

  async getStats(companyId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalSales, monthlySales, totalRevenue, monthlyRevenue] = await Promise.all([
      this.saleModel.countDocuments({ companyId }),
      this.saleModel.countDocuments({ companyId, createdAt: { $gte: monthStart } }),
      this.saleModel.aggregate([
        { $match: { companyId } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      this.saleModel.aggregate([
        { $match: { companyId, createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    return {
      totalSales,
      monthlySales,
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
    };
  }
}
