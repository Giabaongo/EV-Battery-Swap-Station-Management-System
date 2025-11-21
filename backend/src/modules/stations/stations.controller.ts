import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, ParseFloatPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { StationsService } from './stations.service';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { $Enums, StationStatus } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { UseGuards as UserGuards } from '@nestjs/common';
import { findAvailibaleStationsDto } from './dto/find-availiable-station.dto'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('stations')
@ApiBearerAuth('access-token')
@Controller('stations')
@UserGuards(AuthGuard, RolesGuard)
export class StationsController {
  constructor(private readonly stationsService: StationsService) { }

  @Post()
  @Roles($Enums.Role.admin)
  @ApiOperation({ summary: 'Create a new station (Admin only)' })
  @ApiResponse({ status: 201, description: 'The station has been successfully created.' })
  create(@Body() createStationDto: CreateStationDto) {
    return this.stationsService.create(createStationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all stations' })
  @ApiResponse({ status: 200, description: 'List of all stations.' })
  findAll(@Query('status') status?: StationStatus) {
    return this.stationsService.findAll(status);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active stations' })
  @ApiResponse({ status: 200, description: 'List of active stations.' })
  findActive() {
    return this.stationsService.findActiveStations();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search stations by name' })
  @ApiResponse({ status: 200, description: 'List of stations matching the search criteria.' })
  findByName(@Query('name') name: string) {
    return this.stationsService.findByName(name);
  }

  @HttpCode(HttpStatus.OK)
  @Roles($Enums.Role.driver)
  @ApiOperation({ summary: 'Find all available stations for drivers' })
  @ApiResponse({ status: 200, description: 'List of available stations.' })
  @Post('available')
  async findAllAvailable(
    @Body() dto: findAvailibaleStationsDto,
  ) {
    return this.stationsService.findAllAvailable(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a station by ID' })
  @ApiResponse({ status: 200, description: 'The station with the specified ID.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.stationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a station by ID (Admin and Station Staff only)' })
  @ApiResponse({ status: 200, description: 'The station has been successfully updated.' })
  @Roles($Enums.Role.admin)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateStationDto: UpdateStationDto) {
    return this.stationsService.update(id, updateStationDto);
  }

  @Delete(':id')
  @Roles($Enums.Role.admin)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.stationsService.remove(id);
  }
}
