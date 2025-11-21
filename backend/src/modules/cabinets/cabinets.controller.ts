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

  @Get('available-slots/:station_id')
  getAvailableSlots(@Param('station_id', ParseIntPipe) station_id: number) {
    return this.cabinetsService.findAllEmptySlotsAtStation(station_id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCabinetDto: UpdateCabinetDto) {
    return this.cabinetsService.updateCabinet(id, updateCabinetDto);
  }
}
