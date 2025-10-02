import { IsString, MinLength } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @MinLength(1)
  body: string;
}

export class CreateNoteDto2 {
  @IsString()
  @MinLength(2)
  body: number;
}
