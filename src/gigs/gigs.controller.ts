import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { GigsService } from './gigs.service';
import { CreateGigDto } from './dto/create-gig.dto';
import { UpdateGigDto } from './dto/update-gig.dto';
import { GigFiltersDto } from './dto/gig-filters.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';

@Controller('gigs')
@UseGuards(JwtAuthGuard)
export class GigsController {
  constructor(private readonly gigsService: GigsService) {}

  @Post()
  create(@GetUser('id') userId: string, @Body() createGigDto: CreateGigDto) {
    return this.gigsService.createGig(userId, createGigDto);
  }

  @Get()
  findAll(@Query() filters: GigFiltersDto) {
    return this.gigsService.getGigs(filters);
  }

  @Get('my-gigs')
  findMyGigs(@GetUser('id') userId: string) {
    return this.gigsService.getGigsByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gigsService.getGigById(id);
  }

  @Put(':id')
  update(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateGigDto: UpdateGigDto,
  ) {
    return this.gigsService.updateGig(userId, id, updateGigDto);
  }

  @Delete(':id')
  remove(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.gigsService.deleteGig(userId, id);
  }
}
