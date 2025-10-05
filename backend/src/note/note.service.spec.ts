import { Test, TestingModule } from '@nestjs/testing';
import { Note } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NoteService } from './note.service';

describe('NoteService', () => {
  let service: NoteService;
  const noteCreateMock = jest.fn();
  const noteFindManyMock = jest.fn();
  const prismaServiceMock = {
    note: {
      create: noteCreateMock,
      findMany: noteFindManyMock,
    },
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoteService,
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    service = module.get<NoteService>(NoteService);
    noteCreateMock.mockReset();
    noteFindManyMock.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a note through Prisma', async () => {
    const dto = { body: 'hello' };
    const created: Note = {
      id: 1,
      body: dto.body,
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId: 1,
    };
    noteCreateMock.mockResolvedValue(created);

    await expect(service.create(1, dto)).resolves.toEqual(created);
    expect(noteCreateMock).toHaveBeenCalledWith({
      data: { body: dto.body, author: { connect: { id: 1 } } },
    });
  });

  it('should return all notes through Prisma', async () => {
    const notes: Note[] = [
      {
        id: 1,
        body: 'note',
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 1,
      },
    ];
    noteFindManyMock.mockResolvedValue(notes);

    await expect(service.findAllForUser(1)).resolves.toEqual(notes);
    expect(noteFindManyMock).toHaveBeenCalledWith({
      where: { authorId: 1 },
      orderBy: { createdAt: 'desc' },
    });
  });
});
