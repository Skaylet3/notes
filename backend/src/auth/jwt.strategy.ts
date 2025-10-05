import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { type Request } from 'express';
import { Strategy, type StrategyOptions } from 'passport-jwt';
import { AUTH_COOKIE_NAME, AuthenticatedUser, JwtPayload } from './types';

type JwtStrategyConstructor = new (options: StrategyOptions) => Strategy;

const cookieExtractor = (request: Request): string | null => {
  const possibleCookies = (request as { cookies?: unknown }).cookies;
  const rawValue =
    typeof possibleCookies === 'object' &&
    possibleCookies !== null &&
    AUTH_COOKIE_NAME in (possibleCookies as Record<string, unknown>)
      ? (possibleCookies as Record<string, unknown>)[AUTH_COOKIE_NAME]
      : undefined;
  if (typeof rawValue !== 'string' || rawValue.length === 0) {
    return null;
  }

  return rawValue;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy as JwtStrategyConstructor,
) {
  constructor() {
    // The passport-jwt constructor currently lacks precise typings.
    // Casting keeps the rest of the strategy strongly typed.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'change-me',
    } satisfies StrategyOptions);
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return { id: payload.sub, email: payload.email };
  }
}
