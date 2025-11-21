import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { $Enums, ReservationStatus } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('reservations')
@ApiBearerAuth('access-token')
@Controller('reservations')
@UseGuards(AuthGuard, RolesGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) { }

  @Roles($Enums.Role.driver)
  @Post()
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiResponse({ status: 201, description: 'The reservation has been successfully created.' })
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.create(createReservationDto);
  }

  @Roles($Enums.Role.driver)
  @Get('/user/:id')
  @ApiOperation({ summary: 'Get all reservations by user ID' })
  @ApiResponse({ status: 200, description: 'List of reservations for the specified user.' })
  findAllByUserId(@Param('id', ParseIntPipe) userId: number) {
    return this.reservationsService.findManyByUserId(userId);
  }

  @Roles($Enums.Role.station_staff)
  @Get('/station/:id')
  @ApiOperation({ summary: 'Get all reservations by station ID' })
  @ApiResponse({ status: 200, description: 'List of reservations for the specified station.' })
  findAllByStationId(@Param('id', ParseIntPipe) stationId: number) {
    return this.reservationsService.findManyByStationId(stationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reservation by ID' })
  @ApiResponse({ status: 200, description: 'The reservation details.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.findOne(+id);
  }


  @Patch(':id')
  @ApiOperation({ summary: 'Update reservation status' })
  @ApiResponse({ status: 200, description: 'The reservation status has been successfully updated.' })
  updateStatus(@Param('id', ParseIntPipe) id: number,
    @Body() input: {
      user_id: number,
      vehicle_id: number,
      status: ReservationStatus
    }) {
    return this.reservationsService.updateReservationStatus(id, input.user_id, input.vehicle_id, input.status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reservationsService.remove(+id);
  }
}
