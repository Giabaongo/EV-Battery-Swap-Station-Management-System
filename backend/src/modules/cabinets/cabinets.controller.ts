import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { CabinetService } from './cabinets.service';
import { CreateCabinetDto } from './dto/create-cabinet.dto';
import { UpdateCabinetDto } from './dto/update-cabinet.dto';

@Controller('cabinets')
export class CabinetsController {
  constructor(private readonly cabinetsService: CabinetService) { }

  @Post()
  create(@Body() createCabinetDto: CreateCabinetDto) {
    return this.cabinetsService.create(createCabinetDto);
  }

  @Get()
  findAll() {
    return this.cabinetsService.findAll();
  }


  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCabinetDto: UpdateCabinetDto) {
    return this.cabinetsService.update(id, updateCabinetDto);
  }
}
