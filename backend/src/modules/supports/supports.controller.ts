import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { SupportsService } from './supports.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto, UpdateSupportAdminDto } from './dto/update-support.dto';
import { $Enums, SupportStatus } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('supports')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RolesGuard, EmailVerifiedGuard)
@Controller('supports')
export class SupportsController {
  constructor(private readonly supportsService: SupportsService) { }

  @Roles($Enums.Role.driver)
  @Post()
  @ApiOperation({ summary: 'Create a new support request' })
  @ApiResponse({ status: 201, description: 'The support request has been successfully created.' })
  create(@Body() createSupportDto: CreateSupportDto) {
    return this.supportsService.create(createSupportDto);
  }

  @Roles($Enums.Role.admin)
  @Get()
  @ApiOperation({ summary: 'Get all support requests (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all support requests.' })
  findAll() {
    return this.supportsService.findAll();
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get support statistics' })
  @ApiResponse({ status: 200, description: 'Support statistics data.' })
  getStatistics() {
    return this.supportsService.getStatistics();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get support requests by user ID' })
  @ApiResponse({ status: 200, description: 'List of support requests for the specified user.' })
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.supportsService.findByUser(userId);
  }

  @Get('station/:stationId')
  @ApiOperation({ summary: 'Get support requests by station ID' })
  @ApiResponse({ status: 200, description: 'List of support requests for the specified station.' })
  findByStation(@Param('stationId', ParseIntPipe) stationId: number) {
    return this.supportsService.findByStation(stationId);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get support requests by status' })
  @ApiResponse({ status: 200, description: 'List of support requests with the specified status.' })
  findByStatus(@Param('status') status: SupportStatus) {
    return this.supportsService.findByStatus(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a support request by ID' })
  @ApiResponse({ status: 200, description: 'The support request with the specified ID.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.supportsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a support request by ID' })
  @ApiResponse({ status: 200, description: 'The support request has been successfully updated.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateSupportDto: UpdateSupportDto) {
    return this.supportsService.update(id, updateSupportDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the status of a support request by ID' })
  @ApiResponse({ status: 200, description: 'The support request status has been successfully updated.' })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: SupportStatus) {
    return this.supportsService.updateStatus(id, status);
  }

  @Roles($Enums.Role.admin)
  @Patch(':id/admin-response')
  @ApiOperation({ summary: 'Update admin response and/or status (Admin only)' })
  @ApiResponse({ status: 200, description: 'The admin response and status have been successfully updated.' })
  updateAdminResponse(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateData: UpdateSupportAdminDto
  ) {
    return this.supportsService.updateAdminResponse(id, updateData);
  }

  @Patch(':id/rating')
  @ApiOperation({ summary: 'Add a rating to a support request by ID' })
  @ApiResponse({ status: 200, description: 'The rating has been successfully added to the support request.' })
  addRating(@Param('id', ParseIntPipe) id: number, @Body('rating') rating: number) {
    return this.supportsService.addRating(id, rating);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.supportsService.remove(id);
  }
}

