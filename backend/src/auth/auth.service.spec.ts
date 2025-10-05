import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, User } from '@prisma/client';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { AUTH_COOKIE_NAME } from './types';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

jest.mock('bcryptjs', () => ({
  hash: jest
    .fn<Promise<string>, [string, number]>()
    .mockResolvedValue('hashed'),
  compare: jest
    .fn<Promise<boolean>, [string, string]>()
    .mockResolvedValue(true),
}));
type BcryptMock = {
  hash: jest.Mock<Promise<string>, [string, number]>;
  compare: jest.Mock<Promise<boolean>, [string, string]>;
};

const bcrypt = jest.requireMock<BcryptMock>('bcryptjs');

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: overrides.id ?? 1,
  email: overrides.email ?? 'user@example.com',
  hashedPassword: overrides.hashedPassword ?? 'hashed',
  createdAt: overrides.createdAt ?? new Date(),
  updatedAt: overrides.updatedAt ?? new Date(),
});

describe('AuthService', () => {
  let service: AuthService;
  const userServiceMock = {
    findByEmail: jest.fn<Promise<User | null>, [string]>(),
    create: jest.fn<Promise<User>, [Prisma.UserCreateInput]>(),
  } satisfies Partial<UserService>;

  const jwtServiceMock: jest.Mocked<Pick<JwtService, 'signAsync'>> = {
    signAsync: jest.fn() as jest.MockedFunction<JwtService['signAsync']>,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get(AuthService);
    userServiceMock.findByEmail.mockReset();
    userServiceMock.create.mockReset();
    jwtServiceMock.signAsync.mockReset();
    bcrypt.hash.mockClear();
    bcrypt.compare.mockClear();
  });

  it('signs up a new user and returns auth payload', async () => {
    const dto: SignUpDto = { email: 'user@example.com', password: 'password' };
    const createdUser = buildUser({ email: dto.email });

    userServiceMock.findByEmail.mockResolvedValue(null);
    userServiceMock.create.mockResolvedValue(createdUser);
    jwtServiceMock.signAsync.mockResolvedValue('signed-token');

    const result = await service.signUp(dto);

    expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
    expect(userServiceMock.create).toHaveBeenCalledWith({
      email: dto.email,
      hashedPassword: 'hashed',
    });
    expect(result).toEqual({
      user: { id: createdUser.id, email: createdUser.email },
      token: 'signed-token',
    });
  });

  it('throws when signing up with duplicate email', async () => {
    const dto: SignUpDto = { email: 'user@example.com', password: 'password' };
    userServiceMock.findByEmail.mockResolvedValue(buildUser());

    await expect(service.signUp(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('signs in an existing user', async () => {
    const dto: SignInDto = { email: 'user@example.com', password: 'password' };
    const user = buildUser({ hashedPassword: 'hashed-pass', email: dto.email });

    userServiceMock.findByEmail.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(true);
    jwtServiceMock.signAsync.mockResolvedValue('signed-token');

    const result = await service.signIn(dto);

    expect(bcrypt.compare).toHaveBeenCalledWith(
      dto.password,
      user.hashedPassword,
    );
    expect(result).toEqual({
      user: { id: user.id, email: user.email },
      token: 'signed-token',
    });
  });

  it('throws when password does not match', async () => {
    const dto: SignInDto = { email: 'user@example.com', password: 'password' };
    const user = buildUser({ hashedPassword: 'hashed-pass', email: dto.email });

    userServiceMock.findByEmail.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(false);

    await expect(service.signIn(dto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws when user is not found', async () => {
    const dto: SignInDto = { email: 'user@example.com', password: 'password' };
    userServiceMock.findByEmail.mockResolvedValue(null);

    await expect(service.signIn(dto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('builds authentication cookie metadata', () => {
    const cookie = service.buildAuthCookie('token');

    expect(cookie).toMatchObject({
      name: AUTH_COOKIE_NAME,
      value: 'token',
    });
    expect(cookie.options).toEqual(
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
      }),
    );
  });

  it('builds logout cookie metadata', () => {
    const cookie = service.buildLogoutCookie();

    expect(cookie).toEqual(
      expect.objectContaining({
        name: AUTH_COOKIE_NAME,
        value: '',
      }),
    );
    expect(cookie.options.maxAge).toBe(0);
  });
});
