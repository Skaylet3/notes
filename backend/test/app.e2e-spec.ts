import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// Prisma types for strong typing in tests
import { Note, Prisma, User } from '@prisma/client';

// ---- In-memory “DB” (typed) ----
let users: User[] = [];
let notes: Note[] = [];
let nextUserId = 1;
let nextNoteId = 1;

// ---- Prisma service mock (typed) ----
type PrismaServiceMock = {
  note: {
    create: jest.Mock<Promise<Note>, [Prisma.NoteCreateArgs]>;
    findMany: jest.Mock<Promise<Note[]>, [Prisma.NoteFindManyArgs?]>;
  };
  user: {
    findUnique: jest.Mock<Promise<User | null>, [Prisma.UserFindUniqueArgs]>;
    create: jest.Mock<Promise<User>, [Prisma.UserCreateArgs]>;
  };
  $connect: jest.Mock<Promise<void>, []>;
  $disconnect: jest.Mock<Promise<void>, []>;
};

describe('App E2E', () => {
  let app: INestApplication;
  let prismaMock: PrismaServiceMock;

  beforeEach(async () => {
    // reset “DB”
    users = [];
    notes = [];
    nextUserId = 1;
    nextNoteId = 1;

    prismaMock = {
      note: {
        create: jest.fn<Promise<Note>, [Prisma.NoteCreateArgs]>(({ data }) => {
          const ts = new Date();
          const input = data as Prisma.NoteCreateInput;

          const note: Note = {
            id: nextNoteId++, // number if your schema uses Int @id
            body: input.body,
            createdAt: ts,
            updatedAt: ts,
            authorId: input.author?.connect?.id ?? null,
          };

          notes.push(note);
          return Promise.resolve(note);
        }),

        findMany: jest.fn<Promise<Note[]>, [Prisma.NoteFindManyArgs?]>(
          (args) => {
            const where = args?.where;
            let result = notes.slice();

            if (where?.authorId !== undefined) {
              result = result.filter((n) => n.authorId === where.authorId);
            }
            if (
              (args?.orderBy as Prisma.NoteOrderByWithRelationInput | undefined)
                ?.createdAt === 'desc'
            ) {
              result.sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
              );
            }

            return Promise.resolve(result);
          },
        ),
      },

      user: {
        findUnique: jest.fn<Promise<User | null>, [Prisma.UserFindUniqueArgs]>(
          ({ where }) => {
            if (where.email) {
              return Promise.resolve(
                users.find((u) => u.email === where.email) ?? null,
              );
            }
            if (where.id) {
              return Promise.resolve(
                users.find((u) => u.id === where.id) ?? null,
              );
            }
            return Promise.resolve(null);
          },
        ),

        create: jest.fn<Promise<User>, [Prisma.UserCreateArgs]>(({ data }) => {
          const ts = new Date();
          const input = data as Prisma.UserCreateInput;

          const user: User = {
            id: nextUserId++, // number if your schema uses Int @id
            email: input.email,
            hashedPassword: input.hashedPassword,
            createdAt: ts,
            updatedAt: ts,
          };

          users.push(user);
          return Promise.resolve(user);
        }),
      },

      $connect: jest.fn<Promise<void>, []>(() => Promise.resolve()),
      $disconnect: jest.fn<Promise<void>, []>(() => Promise.resolve()),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock as unknown as PrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns greeting on GET /', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('registers a user and sets an auth cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send({ email: 'user@example.com', password: 'password123' })
      .expect(201);

    expect(response.body).toEqual({ id: 1, email: 'user@example.com' });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });
    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(response.headers['set-cookie']?.[0]).toContain('Authentication=');
  });

  it('logs in an existing user and issues a cookie', async () => {
    await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send({ email: 'user@example.com', password: 'password123' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({ email: 'user@example.com', password: 'password123' })
      .expect(201);

    expect(response.body).toEqual({ id: 1, email: 'user@example.com' });
    expect(response.headers['set-cookie']?.[0]).toContain('Authentication=');
  });

  it('requires auth for notes and associates notes to the user', async () => {
    const signup = await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send({ email: 'user@example.com', password: 'password123' })
      .expect(201);

    const cookie = signup.headers['set-cookie']?.[0];
    expect(cookie).toBeDefined();

    await request(app.getHttpServer()).get('/note').expect(401);

    const createResponse = await request(app.getHttpServer())
      .post('/note')
      .set('Cookie', cookie)
      .send({ body: 'protected note' })
      .expect(201);

    expect(createResponse.body).toMatchObject({
      id: 1,
      body: 'protected note',
      authorId: 1,
    });

    const listResponse = await request(app.getHttpServer())
      .get('/note')
      .set('Cookie', cookie)
      .expect(200);

    // tell TS what it is
    const list = listResponse.body as Array<
      Pick<Note, 'id' | 'body' | 'authorId'>
    >;

    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id: 1,
      body: 'protected note',
      authorId: 1,
    });

    expect(prismaMock.note.create).toHaveBeenCalledWith({
      data: { body: 'protected note', author: { connect: { id: 1 } } },
    });
    expect(prismaMock.note.findMany).toHaveBeenCalledWith({
      where: { authorId: 1 },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('clears auth cookie on logout', async () => {
    const signup = await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send({ email: 'user@example.com', password: 'password123' })
      .expect(201);

    const cookie = signup.headers['set-cookie']?.[0];

    const response = await request(app.getHttpServer())
      .post('/auth/log-out')
      .set('Cookie', cookie)
      .expect(201);

    expect(response.body).toEqual({ success: true });
    expect(response.headers['set-cookie']?.[0]).toEqual(
      expect.stringContaining('Authentication=;'),
    );
  });
});
