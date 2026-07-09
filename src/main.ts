import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger as NestLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Reflector } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { ResponseInterceptor } from './common/response.interceptor';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.use(helmet());

  const config = app.get(ConfigService);

  // Production env validation
  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  if (nodeEnv === 'production') {
    try {
      config.getOrThrow('JWT_SECRET');
      config.getOrThrow('CORS_ORIGIN');
    } catch {
      NestLogger.error('Missing required environment variables in production (JWT_SECRET, CORS_ORIGIN)');
      process.exit(1);
    }
  }

  const port = config.get<number>('API_PORT', 4000);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: config.get<string>('CORS_ORIGIN', '*'), credentials: true });
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // --- Swagger / OpenAPI ---
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Auth API')
    .setDescription('## Standardized Authentication API\n\nUser authentication with invite-code registration, refresh-token rotation, role-based access control (RBAC), rate limiting, and structured logging.\n\n### Features\n- **Auth** — register, login, refresh, logout\n- **RBAC** — Admin / Moderator / Donator / User\n- **Rate limiting** — 60 req/min (configurable)\n- **Multi-DB** — PostgreSQL · MySQL · SQL Server · MongoDB · SQLite\n- **Logging** — Structured JSON via Pino')
    .setVersion('2.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  const logger = app.get(Logger);
  logger.log(`Server running on http://localhost:${port}`);
  logger.log(`Swagger docs at  http://localhost:${port}/docs`);
  logger.log(`Health check at http://localhost:${port}/api/health`);
  logger.log(`Metrics at     http://localhost:${port}/api/metrics`);
}
bootstrap();
