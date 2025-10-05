import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { type Response } from 'express';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthenticatedUser, LogoutResponse } from './types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async signUp(
    @Body() signUpDto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthenticatedUser> {
    const { user, token } = await this.authService.signUp(signUpDto);
    const cookie = this.authService.buildAuthCookie(token);
    res.cookie(cookie.name, cookie.value, cookie.options);
    return user;
  }

  @Post('sign-in')
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthenticatedUser> {
    const { user, token } = await this.authService.signIn(signInDto);
    const cookie = this.authService.buildAuthCookie(token);
    res.cookie(cookie.name, cookie.value, cookie.options);
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('log-out')
  logOut(@Res({ passthrough: true }) res: Response): LogoutResponse {
    const cookie = this.authService.buildLogoutCookie();
    res.cookie(cookie.name, cookie.value, cookie.options);
    return { success: true };
  }
}
