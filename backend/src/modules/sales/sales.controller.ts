import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, RequirePermissions } from '../../guards/roles.guard';
import { SalesService } from './sales.service';
import { CreateSaleDto, SalePaymentDto } from './dto/sale.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('sales')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post() @RequirePermissions('sales.write')
  create(@Request() req: any, @Body() dto: CreateSaleDto) {
    return this.salesService.create(req.user.companyId, req.user.userId, dto);
  }

  @Get() @RequirePermissions('sales.read')
  findAll(@Request() req: any, @Query() query: PaginationDto & { status?: string }) {
    return this.salesService.findAll(req.user.companyId, query);
  }

  @Get('stats') @RequirePermissions('sales.read')
  getStats(@Request() req: any) {
    return this.salesService.getStats(req.user.companyId);
  }

  @Get(':id') @RequirePermissions('sales.read')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.salesService.findOne(req.user.companyId, id);
  }

  @Get('invoice/:invoiceId') @RequirePermissions('sales.read')
  getInvoice(@Request() req: any, @Param('invoiceId') invoiceId: string) {
    return this.salesService.getInvoice(req.user.companyId, invoiceId);
  }

  @Post(':id/payment') @RequirePermissions('sales.write')
  recordPayment(@Request() req: any, @Param('id') id: string, @Body() dto: SalePaymentDto) {
    return this.salesService.recordPayment(req.user.companyId, id, dto);
  }
}
