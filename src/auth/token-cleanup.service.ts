import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { TokenService } from './token.service';

@Injectable()
export class TokenCleanupService implements OnModuleInit {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(private readonly tokenService: TokenService) {}

  onModuleInit() {
    // Run cleanup every hour (3600000 ms)
    setInterval(() => {
      this.tokenService.cleanupExpiredTokens().catch((err) => {
        this.logger.error('Failed to clean up expired tokens', err);
      });
    }, 3_600_000);
  }
}
