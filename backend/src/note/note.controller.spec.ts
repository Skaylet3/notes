import { Test, TestingModule } from '@nestjs/testing';
import { Note } from '@prisma/client';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';

describe('NoteController', () => {
  let controller: NoteController;
  let noteService: NoteService;

  const noteServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
  } as unknown as NoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoteController],
      providers: [{ provide: NoteService, useValue: noteServiceMock }],
    }).compile();

    controller = module.get<NoteController>(NoteController);
    noteService = module.get<NoteService>(NoteService);
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
    (noteService.create as unknown as jest.Mock).mockResolvedValue(createdNote);

    await expect(controller.create(dto)).resolves.toEqual(createdNote);
    expect(noteService.create).toHaveBeenCalledWith(dto);
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
    (noteService.findAll as unknown as jest.Mock).mockResolvedValue(notes);

    await expect(controller.findAll()).resolves.toEqual(notes);
    expect(noteService.findAll).toHaveBeenCalled();
  });
});
