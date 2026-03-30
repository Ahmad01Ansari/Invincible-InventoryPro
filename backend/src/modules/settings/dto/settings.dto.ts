import { IsNotEmpty, IsString, IsEmail, IsOptional, IsEnum, MinLength } from 'class-validator';

export class UpdateCompanyDto {
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() gstNumber?: string;
  @IsOptional() @IsString() genericTaxId?: string;
  @IsOptional() @IsString() baseCurrency?: string;
  @IsOptional() @IsString() timezone?: string;
}

export class CreateUserDto {
  @IsNotEmpty() @IsString() firstName: string;
  @IsNotEmpty() @IsString() lastName: string;
  @IsNotEmpty() @IsEmail() email: string;
  @IsNotEmpty() @IsString() @MinLength(6) password: string;
  
  @IsNotEmpty() 
  @IsEnum([
    'super_admin',
    'company_owner', 
    'inventory_manager', 
    'sales_manager', 
    'purchase_manager', 
    'accountant', 
    'staff', 
    'read_only'
  ])
  role: string;
}

export class UpdateUserDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  
  @IsOptional() 
  @IsEnum([
    'super_admin',
    'company_owner', 
    'inventory_manager', 
    'sales_manager', 
    'purchase_manager', 
    'accountant', 
    'staff', 
    'read_only'
  ])
  role?: string;

  @IsOptional() @IsString() @MinLength(6) password?: string;
  @IsOptional() isActive?: boolean;
}
