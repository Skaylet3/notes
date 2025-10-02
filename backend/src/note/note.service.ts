import { Injectable } from '@nestjs/common';
import { Note } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';

@Injectable()
export class NoteService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createNoteDto: CreateNoteDto): Promise<Note> {
    return this.prisma.note.create({
      data: {
        body: createNoteDto.body,
      },
    });
  }

  async findAll(): Promise<Note[]> {
    return this.prisma.note.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
