import { Controller, Post } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('database')
export class DatabaseController {
  constructor(private databaseService: DatabaseService) {}

  @Post('reset')
  async resetDatabase() {
    return this.databaseService.resetDatabase();
  }
}
