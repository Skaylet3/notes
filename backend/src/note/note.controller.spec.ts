import { Test, TestingModule } from '@nestjs/testing';
import { Note } from '@prisma/client';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';

describe('NoteController', () => {
  let controller: NoteController;

  const noteServiceMock: jest.Mocked<Pick<NoteService, 'create' | 'findAll'>> =
    {
      create: jest.fn<Promise<Note>, [CreateNoteDto]>(),
      findAll: jest.fn<Promise<Note[]>, []>(),
    };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoteController],
      providers: [{ provide: NoteService, useValue: noteServiceMock }],
    }).compile();

    controller = module.get<NoteController>(NoteController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate note creation to the service', async () => {
    const dto: CreateNoteDto = { body: 'hello world' };
    const createdNote: Note = {
      id: 1,
      body: dto.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    noteServiceMock.create.mockResolvedValue(createdNote);

    await expect(controller.create(dto)).resolves.toEqual(createdNote);
    expect(noteServiceMock.create).toHaveBeenCalledWith(dto);
  });

  it('should delegate fetching notes to the service', async () => {
    const notes: Note[] = [
      {
        id: 1,
        body: 'note',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    noteServiceMock.findAll.mockResolvedValue(notes);

    await expect(controller.findAll()).resolves.toEqual(notes);
    expect(noteServiceMock.findAll).toHaveBeenCalled();
  });
});
