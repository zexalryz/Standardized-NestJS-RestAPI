import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Role } from '../common/constants/role';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async list() {
    return this.prisma.user.findMany({
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });
  }

  async updateRole(id: string, role: Role) {
    if (!Object.values(Role).includes(role)) {
      throw new BadRequestException(`Invalid role: ${role}`);
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });
  }
}
