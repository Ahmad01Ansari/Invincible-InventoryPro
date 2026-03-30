import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, RequirePermissions } from '../../guards/roles.guard';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';

@Controller('warehouses')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post() @RequirePermissions('warehouses.write')
  create(@Request() req: any, @Body() dto: CreateWarehouseDto) { return this.warehousesService.create(req.user.companyId, dto); }

  @Get() @RequirePermissions('warehouses.read')
  findAll(@Request() req: any) { return this.warehousesService.findAll(req.user.companyId); }

  @Get(':id') @RequirePermissions('warehouses.read')
  findOne(@Request() req: any, @Param('id') id: string) { return this.warehousesService.findOne(req.user.companyId, id); }

  @Put(':id') @RequirePermissions('warehouses.update')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateWarehouseDto) { return this.warehousesService.update(req.user.companyId, id, dto); }

  @Delete(':id') @RequirePermissions('warehouses.delete')
  remove(@Request() req: any, @Param('id') id: string) { return this.warehousesService.remove(req.user.companyId, id); }
}
