import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { BatteryTransferTicketService } from './battery-transfer-ticket.service';
import { CreateBatteryTransferTicketDto } from './dto/create-battery-transfer-ticket.dto';
import { UpdateBatteryTransferTicketDto } from './dto/update-battery-transfer-ticket.dto';
import { findBatteryAvailibleForTransfers } from './dto/get-availibale-batteries-transfer.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { $Enums } from '@prisma/client';

@ApiTags('battery-transfer-ticket')
@ApiBearerAuth('access-token')
@Controller('battery-transfer-ticket')
@Roles($Enums.Role.admin, $Enums.Role.station_staff)
export class BatteryTransferTicketController {
  constructor(private readonly batteryTransferTicketService: BatteryTransferTicketService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new battery transfer ticket' })
  @ApiResponse({ status: 201, description: 'The battery transfer ticket has been successfully created.' })
  async create(@Body() createBatteryTransferTicketDto: CreateBatteryTransferTicketDto) {
    try {
      console.log('\n\n====== 🔍 CREATE TICKET REQUEST ======');
      console.log('Full DTO Object:', createBatteryTransferTicketDto);
      console.log('DTO Keys:', Object.keys(createBatteryTransferTicketDto));
      console.log('DTO JSON:', JSON.stringify(createBatteryTransferTicketDto, null, 2));

      console.log('\n📋 Field Details:');
      console.log('  transfer_request_id:', createBatteryTransferTicketDto.transfer_request_id, '| Type:', typeof createBatteryTransferTicketDto.transfer_request_id);
      console.log('  ticket_type:', createBatteryTransferTicketDto.ticket_type, '| Type:', typeof createBatteryTransferTicketDto.ticket_type);
      console.log('  station_id:', createBatteryTransferTicketDto.station_id, '| Type:', typeof createBatteryTransferTicketDto.station_id);
      console.log('  staff_id:', createBatteryTransferTicketDto.staff_id, '| Type:', typeof createBatteryTransferTicketDto.staff_id);
      console.log('  battery_ids:', createBatteryTransferTicketDto.battery_ids, '| Type:', typeof createBatteryTransferTicketDto.battery_ids);
      console.log('  battery_ids isArray:', Array.isArray(createBatteryTransferTicketDto.battery_ids));
      console.log('  battery_ids length:', createBatteryTransferTicketDto.battery_ids?.length);
      console.log('  battery_ids[0]:', createBatteryTransferTicketDto.battery_ids?.[0], '| Type:', typeof createBatteryTransferTicketDto.battery_ids?.[0]);
      console.log('======================================\n');

      return this.batteryTransferTicketService.create(createBatteryTransferTicketDto);
    } catch (error) {
      console.error('❌ ERROR in controller:', error);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all battery transfer tickets' })
  @ApiResponse({ status: 200, description: 'List of battery transfer tickets.' })
  findAll() {
    return this.batteryTransferTicketService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.batteryTransferTicketService.findOne(id);
  }

  @Get('station/:id')
  @ApiOperation({ summary: 'Retrieve battery transfer tickets by station ID' })
  @ApiResponse({ status: 200, description: 'List of battery transfer tickets for the specified station.' })
  findOneByStation(@Param('id', ParseIntPipe) id: number) {
    return this.batteryTransferTicketService.findBatteryTicketByStation(id);
  }


  @Post('available-batteries')
  @ApiOperation({ summary: 'Retrieve available batteries for transfer' })
  @ApiResponse({ status: 200, description: 'List of available batteries for transfer.' })
  findAvailableBatteries(@Body() dto: findBatteryAvailibleForTransfers) {
    return this.batteryTransferTicketService.getAvailableBatteriesForTransfer(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a battery transfer ticket by ID' })
  @ApiResponse({ status: 200, description: 'The battery transfer ticket has been successfully updated.' })
  update(@Param('id') id: string, @Body() updateBatteryTransferTicketDto: UpdateBatteryTransferTicketDto) {
    return this.batteryTransferTicketService.update(+id, updateBatteryTransferTicketDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.batteryTransferTicketService.remove(+id);
  }
}
