import { type CookieOptions } from 'express';

export const AUTH_COOKIE_NAME = 'Authentication' as const;

export interface AuthenticatedUser {
  id: number;
  email: string;
}

export interface AuthCookieDefinition {
  name: typeof AUTH_COOKIE_NAME;
  value: string;
  options: CookieOptions;
}

export interface LogoutResponse {
  success: true;
}

export interface JwtPayload {
  sub: number;
  email: string;
}
