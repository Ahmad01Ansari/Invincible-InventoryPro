import { IsNotEmpty, IsString, IsOptional, IsEmail, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCustomerDto {
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsObject() address?: { street: string; city: string; state: string; country: string; zipCode: string };
  @IsOptional() @IsString() gstNumber?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateCustomerDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsObject() address?: { street: string; city: string; state: string; country: string; zipCode: string };
  @IsOptional() @IsString() gstNumber?: string;
  @IsOptional() @Type(() => Number) @IsNumber() creditBalance?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() isActive?: boolean;
}
