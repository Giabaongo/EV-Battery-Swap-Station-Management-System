import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { BatteryTransferRequestService } from './battery-transfer-request.service';
import { CreateBatteryTransferRequestDto } from './dto/create-battery-transfer-request.dto';
import { UpdateBatteryTransferRequestDto } from './dto/update-battery-transfer-request.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { $Enums } from '@prisma/client';

@UseGuards(AuthGuard, RolesGuard, EmailVerifiedGuard)
@ApiTags('battery-transfer-request')
@ApiBearerAuth('access-token')
@Controller('battery-transfer-request')
export class BatteryTransferRequestController {
  constructor(private readonly batteryTransferRequestService: BatteryTransferRequestService) { }

  @Post()
  @Roles($Enums.Role.admin)
  @ApiOperation({ summary: 'Create a new battery transfer request' })
  @ApiResponse({ status: 201, description: 'The battery transfer request has been successfully created.' })
  create(@Body() createBatteryTransferRequestDto: CreateBatteryTransferRequestDto) {
    return this.batteryTransferRequestService.create(createBatteryTransferRequestDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all battery transfer requests' })
  @ApiResponse({ status: 200, description: 'List of battery transfer requests.' })
  findAll() {
    return this.batteryTransferRequestService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a battery transfer request by ID' })
  @ApiResponse({ status: 200, description: 'The battery transfer request with the specified ID.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.batteryTransferRequestService.findOne(id);
  }

  @Patch(':id')
  @Roles($Enums.Role.admin)
  @ApiOperation({ summary: 'Update a battery transfer request by ID' })
  @ApiResponse({ status: 200, description: 'The battery transfer request has been successfully updated.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateBatteryTransferRequestDto: UpdateBatteryTransferRequestDto) {
    return this.batteryTransferRequestService.update(id, updateBatteryTransferRequestDto);
  }
}
