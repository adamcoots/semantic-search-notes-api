import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post()
  async createNote(@Body() createNoteDto: CreateNoteDto) {
    await this.appService.createNote(createNoteDto);
    return;
  }

  @Post('search')
  async search(@Body() searchNotesDto: SearchNotesDto) {
    const results = await this.appService.search(searchNotesDto.query);
    return results;
  }
}

interface CreateNoteDto {
  content: string;
}

interface SearchNotesDto {
  query: string;
  k?: number;
  maxDistance?: number;
}
