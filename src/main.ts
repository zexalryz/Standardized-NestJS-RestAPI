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

  const config = app.get(ConfigService);
  const publicUrl = config.get<string>('PUBLIC_URL');
  const nodeEnv = config.get<string>('NODE_ENV', 'development');

  // --- Security headers ---
  // When behind an HTTPS proxy (CloudFront, ALB, nginx), disable HSTS
  // so the raw HTTP backend never tells the browser to force HTTPS directly.
  app.use(helmet({
    strictTransportSecurity: publicUrl ? false : undefined,
  }));

  if (publicUrl) {
    // trust first proxy (CloudFront, ALB, nginx) for correct X-Forwarded-* headers
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  // Production env validation
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
    .addBearerAuth();

  if (publicUrl) {
    // Point "Try it out" requests to the public HTTPS origin
    swaggerConfig.addServer(publicUrl);
  }

  const document = SwaggerModule.createDocument(app, swaggerConfig.build());

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: publicUrl ? { url: `${publicUrl}/docs-json` } : undefined,
  });

  await app.listen(port, '0.0.0.0');
  const logger = app.get(Logger);
  logger.log(`Server running on http://localhost:${port}`);
  if (publicUrl) {
    logger.log(`Public URL:    ${publicUrl}`);
    logger.log(`Swagger docs:  ${publicUrl}/docs`);
  } else {
    logger.log(`Swagger docs:  http://localhost:${port}/docs`);
  }
  logger.log(`Health check:  http://localhost:${port}/api/health`);
  logger.log(`Metrics:       http://localhost:${port}/api/metrics`);
}
bootstrap();
