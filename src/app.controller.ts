import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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

  @Get('search')
  async search(@Query('query') query: string) {
    const results = await this.appService.search(query);
    return results;
  }
}

interface CreateNoteDto {
  content: string;
}
