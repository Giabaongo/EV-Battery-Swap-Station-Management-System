import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? [
          'http://localhost:3000', 
          'http://localhost:5173', 
          'http://localhost:5174',
          'https://ev-battery-swap-station-management.vercel.app', // Production Vercel URL
        ]
      : true, // Allow all origins in development (for testing HTML files)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Chỉ cho phép fields trong DTO
      forbidNonWhitelisted: true, // Reject extra fields
      transform: true, // Auto transform types
      disableErrorMessages: false, // Show validation errors
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token, e.g. "Bearer <your-token>"',
        in: 'header',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Enable cookie parsing

  await app.listen(process.env.PORT ?? 8080);
}
bootstrap().catch((error) => console.error('Bootstrap error:', error));
