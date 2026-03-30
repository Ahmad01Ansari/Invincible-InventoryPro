import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsNotEmpty() @IsString() sku: string;
  @IsOptional() @IsString() barcode?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsNotEmpty() @Type(() => Number) @IsNumber() @Min(0) price: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) costPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() taxPercentage?: number;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsArray() images?: string[];
  @IsOptional() @Type(() => Number) @IsNumber() minStockLevel?: number;
  @IsOptional() @Type(() => Number) @IsNumber() reorderThreshold?: number;
}

export class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsString() barcode?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) price?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) costPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() taxPercentage?: number;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsArray() images?: string[];
  @IsOptional() @Type(() => Number) @IsNumber() minStockLevel?: number;
  @IsOptional() @Type(() => Number) @IsNumber() reorderThreshold?: number;
  @IsOptional() isActive?: boolean;
}
