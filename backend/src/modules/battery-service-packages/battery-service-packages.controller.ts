import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ParseFloatPipe,
  UseGuards
} from '@nestjs/common';
import { BatteryServicePackagesService } from './battery-service-packages.service';
import { CreateBatteryServicePackageDto } from './dto/create-battery-service-package.dto';
import { UpdateBatteryServicePackageDto } from './dto/update-battery-service-package.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { $Enums } from '.prisma/client/default.js';
import { Roles } from '../../common/decorators/roles.decorator';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@UseGuards(AuthGuard, RolesGuard, EmailVerifiedGuard)
@ApiTags('battery-service-packages')
@ApiBearerAuth('access-token')
@Controller('battery-service-packages')
export class BatteryServicePackagesController {
  constructor(private readonly batteryServicePackagesService: BatteryServicePackagesService) { }

  @Roles($Enums.Role.admin)
  @Post()
  @ApiOperation({ summary: 'Create a new battery service package' })
  @ApiResponse({ status: 201, description: 'The battery service package has been successfully created.' })
  create(@Body() createBatteryServicePackageDto: CreateBatteryServicePackageDto) {
    return this.batteryServicePackagesService.create(createBatteryServicePackageDto);
  }

  @Roles($Enums.Role.admin, $Enums.Role.driver)
  @Get()
  @ApiOperation({ summary: 'Retrieve all battery service packages' })
  @ApiResponse({ status: 200, description: 'List of battery service packages.' })
  findAll(@Query('activeOnly') activeOnly?: string) {
    const isActiveOnly = activeOnly === 'true';
    return this.batteryServicePackagesService.findAll(isActiveOnly);
  }

  @Get('active')
  @ApiOperation({ summary: 'Retrieve all active battery service packages' })
  @ApiResponse({ status: 200, description: 'List of active battery service packages.' })
  findActive() {
    return this.batteryServicePackagesService.findActive();
  }

  @Get('price-range')
  @ApiOperation({ summary: 'Retrieve battery service packages within a price range' })
  @ApiResponse({ status: 200, description: 'List of battery service packages within the specified price range.' })
  getPackagesByPriceRange(
    @Query('minPrice', ParseFloatPipe) minPrice: number,
    @Query('maxPrice', ParseFloatPipe) maxPrice: number,
  ) {
    return this.batteryServicePackagesService.getPackagesByPriceRange(minPrice, maxPrice);
  }

  @Get('duration/:days')
  @ApiOperation({ summary: 'Retrieve battery service packages by duration in days' })
  @ApiResponse({ status: 200, description: 'List of battery service packages with the specified duration.' })
  getPackagesByDuration(@Param('days', ParseIntPipe) durationDays: number) {
    return this.batteryServicePackagesService.getPackagesByDuration(durationDays);
  }

  @Get('name/:name')
  @ApiOperation({ summary: 'Retrieve a battery service package by name' })
  @ApiResponse({ status: 200, description: 'The battery service package with the specified name.' })
  findByName(@Param('name') name: string) {
    return this.batteryServicePackagesService.findByName(name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a battery service package by ID' })
  @ApiResponse({ status: 200, description: 'The battery service package with the specified ID.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.batteryServicePackagesService.findOne(id);
  }

  @Roles($Enums.Role.admin)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a battery service package by ID' })
  @ApiResponse({ status: 200, description: 'The battery service package has been successfully updated.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBatteryServicePackageDto: UpdateBatteryServicePackageDto
  ) {
    return this.batteryServicePackagesService.update(id, updateBatteryServicePackageDto);
  }

  @Roles($Enums.Role.admin)
  @Patch(':id/activate')
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.batteryServicePackagesService.activate(id);
  }

  @Roles($Enums.Role.admin)
  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.batteryServicePackagesService.deactivate(id);
  }

  @Roles($Enums.Role.admin)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.batteryServicePackagesService.remove(id);
  }
}
