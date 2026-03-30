import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, RequirePermissions } from '../../guards/roles.guard';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto, UpdatePurchaseStatusDto, PurchasePaymentDto } from './dto/purchase.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('purchases')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post() @RequirePermissions('purchases.write')
  create(@Request() req: any, @Body() dto: CreatePurchaseDto) {
    return this.purchasesService.create(req.user.companyId, req.user.userId, dto);
  }

  @Get() @RequirePermissions('purchases.read')
  findAll(@Request() req: any, @Query() query: PaginationDto & { status?: string }) {
    return this.purchasesService.findAll(req.user.companyId, query);
  }

  @Get('stats') @RequirePermissions('purchases.read')
  getStats(@Request() req: any) {
    return this.purchasesService.getStats(req.user.companyId);
  }

  @Get(':id') @RequirePermissions('purchases.read')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.purchasesService.findOne(req.user.companyId, id);
  }

  @Put(':id/status') @RequirePermissions('purchases.update')
  updateStatus(@Request() req: any, @Param('id') id: string, @Body() dto: UpdatePurchaseStatusDto) {
    return this.purchasesService.updateStatus(req.user.companyId, id, req.user.userId, dto);
  }

  @Post(':id/payment') @RequirePermissions('purchases.write')
  recordPayment(@Request() req: any, @Param('id') id: string, @Body() dto: PurchasePaymentDto) {
    return this.purchasesService.recordPayment(req.user.companyId, id, dto);
  }
}
