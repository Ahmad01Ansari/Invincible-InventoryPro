import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, RequirePermissions } from '../../guards/roles.guard';
import { InventoryService } from './inventory.service';
import { StockInDto, StockOutDto, StockAdjustDto, StockTransferDto } from './dto/inventory.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('inventory')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @RequirePermissions('inventory.read')
  getStock(@Request() req: any, @Query() query: PaginationDto) {
    return this.inventoryService.getStock(req.user.companyId, query);
  }

  @Post('stock-in')
  @RequirePermissions('inventory.write')
  stockIn(@Request() req: any, @Body() dto: StockInDto) {
    return this.inventoryService.stockIn(req.user.companyId, req.user.userId, dto);
  }

  @Post('stock-out')
  @RequirePermissions('inventory.write')
  stockOut(@Request() req: any, @Body() dto: StockOutDto) {
    return this.inventoryService.stockOut(req.user.companyId, req.user.userId, dto);
  }

  @Post('adjust')
  @RequirePermissions('inventory.update')
  stockAdjust(@Request() req: any, @Body() dto: StockAdjustDto) {
    return this.inventoryService.stockAdjust(req.user.companyId, req.user.userId, dto);
  }

  @Post('transfer')
  @RequirePermissions('inventory.write')
  stockTransfer(@Request() req: any, @Body() dto: StockTransferDto) {
    return this.inventoryService.stockTransfer(req.user.companyId, req.user.userId, dto);
  }

  @Get('logs')
  @RequirePermissions('inventory.read')
  getStockLogs(@Request() req: any, @Query() query: PaginationDto & { productId?: string }) {
    return this.inventoryService.getStockLogs(req.user.companyId, query);
  }
}
