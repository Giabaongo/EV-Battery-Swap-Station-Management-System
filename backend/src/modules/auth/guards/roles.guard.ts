import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { $Enums } from '@prisma/client';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Lấy roles required từ decorator
        const requiredRoles = this.reflector.getAllAndOverride<$Enums.Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Nếu không có role requirement → allow
        if (!requiredRoles) {
            return true;
        }

        // Lấy user từ request (đã được set bởi AuthGuard)
        const { user } = context.switchToHttp().getRequest();

        if (!user) {
            throw new ForbiddenException('User not found in request. Make sure AuthGuard is applied first.');
        }

        // Kiểm tra user có role required không
        const hasRole = requiredRoles.some((role) => user.role === role);

        if (!hasRole) {
            throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
        }

        return true;
    }
}
