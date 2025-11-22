import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger('HttpExceptionFilter');

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        // Log detailed validation errors
        if (status === 400) {
            this.logger.error(`❌ 400 Bad Request on ${request.method} ${request.url}`);
            this.logger.error(`Request Body:`, JSON.stringify(request.body, null, 2));
            this.logger.error(`Exception Response:`, JSON.stringify(exceptionResponse, null, 2));
        }

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: exceptionResponse['message'] || exception.message,
            ...(exceptionResponse as object),
        });
    }
}
