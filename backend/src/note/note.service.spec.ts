import { Test, TestingModule } from '@nestjs/testing';
import { Note } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NoteService } from './note.service';

describe('NoteService', () => {
  let service: NoteService;
  const prismaServiceMock = {
    note: {
      create: jest.fn(),
      findMany: jest.fn(),
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
    jest.clearAllMocks();
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
    };
    (prismaServiceMock.note.create as unknown as jest.Mock).mockResolvedValue(
      created,
    );

    await expect(service.create(dto)).resolves.toEqual(created);
    expect(prismaServiceMock.note.create).toHaveBeenCalledWith({
      data: { body: dto.body },
    });
  });

  it('should return all notes through Prisma', async () => {
    const notes: Note[] = [
      {
        id: 1,
        body: 'note',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    (prismaServiceMock.note.findMany as unknown as jest.Mock).mockResolvedValue(
      notes,
    );

    await expect(service.findAll()).resolves.toEqual(notes);
    expect(prismaServiceMock.note.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    });
  });
});
