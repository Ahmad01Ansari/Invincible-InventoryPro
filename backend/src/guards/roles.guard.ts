import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Permission format: 'module.action' e.g. 'products.read', 'products.write', 'products.update', 'products.delete'
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Role hierarchy - higher roles inherit all lower permissions
const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 100,
  company_owner: 90,
  inventory_manager: 60,
  sales_manager: 60,
  purchase_manager: 60,
  accountant: 50,
  staff: 30,
  read_only: 10,
};

// Default permissions per role
const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'],
  company_owner: ['*'],
  inventory_manager: [
    'products.read', 'products.write', 'products.update', 'products.delete',
    'categories.read', 'categories.write', 'categories.update', 'categories.delete',
    'inventory.read', 'inventory.write', 'inventory.update', 'inventory.delete',
    'warehouses.read', 'warehouses.write', 'warehouses.update',
    'vendors.read',
    'customers.read',
    'purchases.read', 'purchases.write', 'purchases.update',
    'reports.read',
    'dashboard.read',
  ],
  sales_manager: [
    'products.read',
    'categories.read',
    'inventory.read',
    'customers.read', 'customers.write', 'customers.update',
    'sales.read', 'sales.write', 'sales.update', 'sales.delete',
    'reports.read',
    'dashboard.read',
  ],
  purchase_manager: [
    'products.read',
    'categories.read',
    'inventory.read',
    'vendors.read', 'vendors.write', 'vendors.update',
    'purchases.read', 'purchases.write', 'purchases.update', 'purchases.delete',
    'reports.read',
    'dashboard.read',
  ],
  accountant: [
    'products.read',
    'customers.read',
    'vendors.read',
    'purchases.read',
    'sales.read',
    'reports.read',
    'dashboard.read',
  ],
  staff: [
    'products.read',
    'inventory.read',
    'customers.read',
    'vendors.read',
    'warehouses.read',
    'purchases.read',
    'sales.read',
    'dashboard.read',
  ],
  read_only: [
    'products.read',
    'inventory.read',
    'customers.read',
    'vendors.read',
    'warehouses.read',
    'purchases.read',
    'sales.read',
    'dashboard.read',
    'reports.read',
  ],
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permissions required = public route (but still needs auth)
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    // Super admin and company owner have full access
    if (user.role === 'super_admin' || user.role === 'company_owner') {
      return true;
    }

    // Check user's custom permissions first, then fall back to role defaults
    const userPermissions = user.permissions?.length > 0
      ? user.permissions
      : DEFAULT_ROLE_PERMISSIONS[user.role] || [];

    // Wildcard = full access
    if (userPermissions.includes('*')) {
      return true;
    }

    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `You do not have permission to perform this action. Required: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
