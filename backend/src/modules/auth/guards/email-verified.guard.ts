import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_EMAIL_VERIFIED_KEY } from '../../../common/decorators/email-verified.decorator';
import { DatabaseService } from 'src/modules/database/database.service';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private databaseService: DatabaseService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Check nếu route có require email verified
        const requireEmailVerified = this.reflector.getAllAndOverride<boolean>(
            REQUIRE_EMAIL_VERIFIED_KEY,
            [context.getHandler(), context.getClass()],
        );

        // Nếu không require thì cho qua
        if (!requireEmailVerified) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user; // Lấy từ JWT payload (sau khi qua JwtAuthGuard)

        if (!user || !user.user_id) {
            throw new UnauthorizedException('Vui lòng đăng nhập');
        }

        // Check email verified trong database
        const userData = await this.databaseService.user.findUnique({
            where: { user_id: user.user_id },
            select: { email_verified: true },
        });

        if (!userData) {
            throw new UnauthorizedException('Người dùng không tồn tại');
        }

        if (!userData.email_verified) {
            throw new ForbiddenException(
                'Vui lòng xác thực email trước khi thực hiện hành động này',
            );
        }

        return true;
    }
}