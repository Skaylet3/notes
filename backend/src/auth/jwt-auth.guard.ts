import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedUser } from './types';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = AuthenticatedUser>(err: unknown, user: unknown): TUser {
    if (err) {
      if (err instanceof Error) {
        throw err;
      }

      throw new UnauthorizedException('Unauthorized');
    }

    if (!JwtAuthGuard.isAuthenticatedUser(user)) {
      throw new UnauthorizedException('Unauthorized');
    }

    return user as TUser;
  }

  private static isAuthenticatedUser(
    candidate: unknown,
  ): candidate is AuthenticatedUser {
    return (
      typeof candidate === 'object' &&
      candidate !== null &&
      typeof (candidate as Record<string, unknown>).id === 'number' &&
      typeof (candidate as Record<string, unknown>).email === 'string'
    );
  }
}
