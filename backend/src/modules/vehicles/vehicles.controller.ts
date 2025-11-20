import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { $Enums, Role } from '@prisma/client';
import { AssignVehicleDto } from './dto/assign-vehicle.dto';
import { AddVehicleDto } from './dto/add-vehicle.dto';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { ApiResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { ApiOperation } from '@nestjs/swagger/dist/decorators/api-operation.decorator';

@Controller('vehicles')
@UseGuards(AuthGuard, RolesGuard, EmailVerifiedGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) { }

  @Roles($Enums.Role.admin)
  @Post()
  @ApiOperation({ summary: 'Create a new vehicle' })
  @ApiResponse({ status: 201, description: 'The vehicle has been successfully created.' })
  create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get('/user/:id')
  @ApiOperation({ summary: 'Get all vehicles for a specific user' })
  @ApiResponse({ status: 200, description: 'List of vehicles for the user.' })
  findAll(@Param('id', ParseIntPipe) userId: number) {
    return this.vehiclesService.findManyByUser(userId);
  }

  @Roles($Enums.Role.driver)
  @Get('vin/:vin')
  @ApiOperation({ summary: 'Get vehicle by VIN' })
  @ApiResponse({ status: 200, description: 'Vehicle details.' })
  findByVin(@Param('vin') vin: string) {
    return this.vehiclesService.findByVin(vin);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  @ApiResponse({ status: 200, description: 'Vehicle details.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.findOne(id);
  }

  @Patch('add-vehicle')
  @ApiOperation({ summary: 'Add a vehicle to the current user' })
  @ApiResponse({ status: 200, description: 'Vehicle added to the current user.' })
  @Roles($Enums.Role.driver)
  addVehicleToCurrentUser(
    @Body() addVehicleDto: AddVehicleDto,
    @Req() req: Request,
  ) {
    // Get user_id from JWT token (attached by AuthGuard)
    const user = req['user'] as any;

    // Validate that user info exists
    if (!user || !user.sub) {
      throw new UnauthorizedException('User information not found in token');
    }

    return this.vehiclesService.assignVehicleToUser({
      vin: addVehicleDto.vin,
      user_id: user.sub, // user.sub contains the user_id from JWT payload
    });
  }

  @Patch('remove-vehicle')
  @ApiOperation({ summary: 'Remove vehicle assignment from the current user' })
  @ApiResponse({ status: 200, description: 'Vehicle removed from the current user.' })
  removeVehicleFromCurrentUser(
    @Body() removeDto: AddVehicleDto,
    @Req() req: Request,
  ) {
    // Get user_id from JWT token (attached by AuthGuard)
    const user = req['user'] as any;

    // Validate that user info exists
    if (!user || !user.sub) {
      throw new UnauthorizedException('User information not found in token');
    }

    return this.vehiclesService.removeVehicleFromUser(removeDto.vin, user.sub);
  }

  @Roles($Enums.Role.driver)
  @Patch('assign-vehicle')
  @ApiOperation({ summary: 'Assign a vehicle to a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'Vehicle assigned to the user.' })
  assignVehicleToUser(
    @Body() assignVehicleDto: AssignVehicleDto,
  ) {
    return this.vehiclesService.assignVehicleToUser(assignVehicleDto);
  }

  @Roles($Enums.Role.admin)
  @Patch(':id')
  @ApiOperation({ summary: 'Update vehicle by ID' })
  @ApiResponse({ status: 200, description: 'Updated vehicle details.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  // @Delete(':id')
  // @Roles('admin')
  // remove(@Param('id', ParseIntPipe) id: number) {
  //   return this.vehiclesService.remove(id);
  // }
}
