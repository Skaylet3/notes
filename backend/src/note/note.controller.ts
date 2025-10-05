import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Note } from '@prisma/client';
import { type Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteService } from './note.service';

@Controller('note')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() req: Request & { user: AuthenticatedUser },
    @Body() createNoteDto: CreateNoteDto,
  ): Promise<Note> {
    return this.noteService.create(req.user.id, createNoteDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: Request & { user: AuthenticatedUser }): Promise<Note[]> {
    return this.noteService.findAllForUser(req.user.id);
  }
}
