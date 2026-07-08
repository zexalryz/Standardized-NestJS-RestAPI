import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const { username, email, password, inviteCode } = dto;

    const invite = await this.prisma.inviteCode.findUnique({
      where: { code: inviteCode },
    });
    if (!invite) {
      throw new BadRequestException('Invalid invite code');
    }
    if (invite.used) {
      throw new BadRequestException('Invite code already used');
    }

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing) {
      if (existing.username === username) {
        throw new ConflictException('Username already taken');
      }
      throw new ConflictException('Email already registered');
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: { username, email, password: hashed },
    });

    await this.prisma.inviteCode.update({
      where: { code: inviteCode },
      data: { used: true, usedBy: user.id, usedAt: new Date() },
    });

    return this.signToken(user.id, user.username);
  }

  async login(dto: LoginDto) {
    const { username, password } = dto;

    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signToken(user.id, user.username);
  }

  private signToken(id: string, username: string) {
    const payload = { sub: id, username };
    const accessToken = this.jwt.sign(payload);
    return { accessToken };
  }
}
