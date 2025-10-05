import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import {
  AUTH_COOKIE_NAME,
  AuthCookieDefinition,
  AuthenticatedUser,
  JwtPayload,
} from './types';

const BCRYPT_SALT_ROUNDS = 10;

export interface AuthResult {
  user: AuthenticatedUser;
  token: string;
}

@Injectable()
export class AuthService {
  private readonly cookieName = AUTH_COOKIE_NAME;
  private readonly jwtExpirationSeconds = AuthService.resolveJwtExpiration();

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<AuthResult> {
    const existingUser = await this.userService.findByEmail(signUpDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(
      signUpDto.password,
      BCRYPT_SALT_ROUNDS,
    );
    const user = await this.userService.create({
      email: signUpDto.email,
      hashedPassword,
    });

    return this.buildAuthResult(user);
  }

  async signIn(signInDto: SignInDto): Promise<AuthResult> {
    const user = await this.validateUser(signInDto.email, signInDto.password);
    return this.buildAuthResult(user);
  }

  buildAuthCookie(token: string): AuthCookieDefinition {
    return {
      name: this.cookieName,
      value: token,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: process.env.NODE_ENV === 'production',
        maxAge: this.jwtExpirationSeconds * 1000,
      },
    };
  }

  buildLogoutCookie(): AuthCookieDefinition {
    return {
      name: this.cookieName,
      value: '',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 0,
      },
    };
  }

  private async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, user.hashedPassword);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private async buildAuthResult(user: User): Promise<AuthResult> {
    const token = await this.jwtService.signAsync(this.buildJwtPayload(user));

    return { user: this.sanitizeUser(user), token };
  }

  private sanitizeUser(user: User): AuthenticatedUser {
    return { id: user.id, email: user.email };
  }

  private buildJwtPayload(user: User): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
    };
  }

  private static resolveJwtExpiration(): number {
    const fallbackSeconds = 3600;
    const configured = process.env.JWT_EXPIRATION;

    if (!configured) {
      return fallbackSeconds;
    }

    const parsed = Number.parseInt(configured, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackSeconds;
  }
}
