import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NoteController],
  providers: [NoteService],
})
export class NoteModule {}
