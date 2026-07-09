import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async log(userId: string, type: string, detail = '') {
    return this.prisma.activityLog.create({
      data: { userId, type, detail },
    });
  }

  async list(userId: string, take = 50) {
    return this.prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(take, 100),
      select: { id: true, type: true, detail: true, createdAt: true },
    });
  }
}
