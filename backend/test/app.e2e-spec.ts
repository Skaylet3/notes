import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

type PrismaServiceMock = {
  note: {
    create: jest.Mock;
    findMany: jest.Mock;
  };
  $connect: jest.Mock;
  $disconnect: jest.Mock;
};

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaMock: PrismaServiceMock;

  beforeEach(async () => {
    prismaMock = {
      note: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock as unknown as PrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/note (POST) creates a note via Prisma', async () => {
    const body = { body: 'integration note' };
    const createdNoteRecord = {
      id: 1,
      body: body.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.note.create.mockResolvedValue(createdNoteRecord);

    const response = await request(app.getHttpServer())
      .post('/note')
      .send(body)
      .expect(201);

    expect(response.body).toEqual({
      id: createdNoteRecord.id,
      body: createdNoteRecord.body,
      createdAt: createdNoteRecord.createdAt.toISOString(),
      updatedAt: createdNoteRecord.updatedAt.toISOString(),
    });
    expect(prismaMock.note.create).toHaveBeenCalledWith({
      data: { body: body.body },
    });
  });

  it('/note (GET) lists notes via Prisma', async () => {
    const notes = [
      {
        id: 2,
        body: 'first note',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 1,
        body: 'second note',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    prismaMock.note.findMany.mockResolvedValue(notes);

    const response = await request(app.getHttpServer())
      .get('/note')
      .expect(200);

    expect(response.body).toEqual(
      notes.map((note) => ({
        id: note.id,
        body: note.body,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      })),
    );
    expect(prismaMock.note.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    });
  });
});
