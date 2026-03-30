import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, RequirePermissions } from '../../guards/roles.guard';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('products')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @RequirePermissions('products.write')
  create(@Request() req: any, @Body() dto: CreateProductDto) {
    return this.productsService.create(req.user.companyId, dto);
  }

  @Get()
  @RequirePermissions('products.read')
  findAll(@Request() req: any, @Query() query: PaginationDto) {
    return this.productsService.findAll(req.user.companyId, query);
  }

  @Get('low-stock')
  @RequirePermissions('products.read')
  getLowStock(@Request() req: any) {
    return this.productsService.getLowStock(req.user.companyId);
  }

  @Get(':id')
  @RequirePermissions('products.read')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.productsService.findOne(req.user.companyId, id);
  }

  @Put(':id')
  @RequirePermissions('products.update')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(req.user.companyId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('products.delete')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.productsService.remove(req.user.companyId, id);
  }
}
