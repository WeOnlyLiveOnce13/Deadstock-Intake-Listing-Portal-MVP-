import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/types/index.js';
import { SignInInput, SignUpInput } from './dto/auth.schema';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.jwtSecret =
      this.config.get<string>('JWT_SECRET') || 'fallback-secret-change-me';
    this.jwtExpiresIn = this.config.get<string>('JWT_EXPIRES_IN') || '7d';
  }

  async signUp(data: SignUpInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await this.prisma.user.create({
      data: { email: data.email, password: hashedPassword },
      select: { id: true, email: true },
    });

    return { user, token: this.generateToken(user.id, user.email) };
  }

  async signIn(data: SignInInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    return {
      user: { id: user.id, email: user.email },
      token: this.generateToken(user.id, user.email),
    };
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
  }

  private generateToken(userId: string, email: string): string {
    return jwt.sign({ sub: userId, email }, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
  }
}
