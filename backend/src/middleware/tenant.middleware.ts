import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Tenant Middleware
 * Extracts companyId from the JWT payload (set by Passport) and
 * attaches it to the request object for easy access in controllers/services.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // After JWT auth guard runs, req.user contains { userId, email, companyId, role }
    if ((req as any).user?.companyId) {
      (req as any).tenantId = (req as any).user.companyId;
    }
    next();
  }
}
