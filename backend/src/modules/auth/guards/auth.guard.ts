import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authorization = request.headers.authorization;
        const token = authorization?.split(' ')[1];
        if (!token) {
            throw new UnauthorizedException('Access token is required');
        }
        try {
            const payload = await this.jwtService.verifyAsync(token);
            request.user = {
                sub: payload.sub,           // JWT standard field
                user_id: payload.sub,       // Backward compatibility
                name: payload.username,
                email: payload.email,
                phone: payload.phone,
                role: payload.role
            }
            return true;
        } catch (error) {
            throw new UnauthorizedException();
        }
    }
}
