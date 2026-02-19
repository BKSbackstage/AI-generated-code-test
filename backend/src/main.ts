import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as compression from 'compression';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3001;
  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get('FRONTEND_URL') || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger Documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Backstage Global API')
      .setDescription('The Backstage Global Event Ticketing Platform API')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT',
      )
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('events', 'Event management')
      .addTag('tickets', 'Ticket operations')
      .addTag('payments', 'Payment processing')
      .addTag('artists', 'Artist profiles')
      .addTag('promoters', 'Promoter management')
      .addTag('marketplace', 'NFT Marketplace')
      .addTag('admin', 'Admin operations')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`Swagger docs available at: http://localhost:${port}/docs`);
  }

  await app.listen(port);
  logger.log(`Backstage Global API running on port ${port}`);
  logger.log(`Environment: ${configService.get('NODE_ENV') || 'development'}`);
}

bootstrap();
