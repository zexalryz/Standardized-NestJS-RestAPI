import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TokenService {
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresInDays: number;
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.accessExpiresIn = this.config.get<string>('JWT_EXPIRATION', '15m');
    this.refreshExpiresInDays = 7;
  }

  generateAccessToken(user: { id: string; username: string; role: string }) {
    const payload = { sub: user.id, username: user.username, role: user.role };
    return this.jwt.sign(payload, { expiresIn: this.accessExpiresIn } as any);
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshExpiresInDays);

    await this.prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });

    return token;
  }

  async rotateRefreshToken(oldToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Atomic: only one concurrent request wins the revoke
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { token: oldToken, revoked: false, expiresAt: { gt: new Date() } },
      data: { revoked: true },
    });
    if (count === 0) throw new UnauthorizedException('Invalid or expired refresh token');

    // Fetch the userId from the now-revoked token
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: oldToken },
      select: { userId: true },
    });
    if (!stored) throw new UnauthorizedException('Invalid or expired refresh token');

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    return { accessToken, refreshToken };
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token, revoked: false },
      data: { revoked: true },
    });
  }

  async cleanupExpiredTokens(): Promise<number> {
    const { count } = await this.prisma.refreshToken.deleteMany({
      where: { OR: [{ revoked: true }, { expiresAt: { lte: new Date() } }] },
    });
    if (count > 0) this.logger.log(`Cleaned up ${count} expired/revoked refresh tokens`);
    return count;
  }
}
