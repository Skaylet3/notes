import { Test, TestingModule } from '@nestjs/testing';
import { Note } from '@prisma/client';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';

describe('NoteController', () => {
  let controller: NoteController;

  const noteServiceMock: jest.Mocked<
    Pick<NoteService, 'create' | 'findAllForUser'>
  > = {
    create: jest.fn<Promise<Note>, [number, CreateNoteDto]>(),
    findAllForUser: jest.fn<Promise<Note[]>, [number]>(),
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
      authorId: 1,
    };
    noteServiceMock.create.mockResolvedValue(createdNote);

    const userRequest = { user: { id: 1, email: 'user@example.com' } };
    await expect(controller.create(userRequest as never, dto)).resolves.toEqual(
      createdNote,
    );
    expect(noteServiceMock.create).toHaveBeenCalledWith(
      userRequest.user.id,
      dto,
    );
  });

  it('should delegate fetching notes to the service', async () => {
    const notes: Note[] = [
      {
        id: 1,
        body: 'note',
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 1,
      },
    ];
    const userRequest = { user: { id: 1, email: 'user@example.com' } };
    noteServiceMock.findAllForUser.mockResolvedValue(notes);

    await expect(controller.findAll(userRequest as never)).resolves.toEqual(
      notes,
    );
    expect(noteServiceMock.findAllForUser).toHaveBeenCalledWith(
      userRequest.user.id,
    );
  });
});
