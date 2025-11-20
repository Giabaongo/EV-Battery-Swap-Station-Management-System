import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BatteriesService } from './batteries.service';
import { CreateBatteryDto } from './dto/create-battery.dto';
import { UpdateBatteryDto } from './dto/update-battery.dto';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { $Enums } from '.prisma/client';
import { SimulateBatteryDischargeDto, SetBatteryChargeDto } from './dto/simulate-discharge.dto';
import { SimulateChargeForStationDto } from './dto/simulate-charge-for-station.dto';

@UseGuards(AuthGuard, RolesGuard, EmailVerifiedGuard)
@ApiBearerAuth('access-token')
@ApiTags('batteries')
@Controller('batteries')
export class BatteriesController {
  constructor(private readonly batteriesService: BatteriesService) { }

  @Roles($Enums.Role.admin, $Enums.Role.station_staff)
  @ApiOperation({ summary: 'Create a new battery' })
  @ApiResponse({ status: 201, description: 'The battery has been successfully created.' })
  @Post()
  create(@Body() createBatteryDto: CreateBatteryDto) {
    return this.batteriesService.create(createBatteryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all batteries' })
  @ApiResponse({ status: 200, description: 'List of batteries.' })
  findAll() {
    return this.batteriesService.findAll();
  }

  @Get('best')
  findBestBattery(@Body() input: {
    vehicle_id: number,
    station_id: number
  }) {
    return this.batteriesService.findBestBatteryForVehicle(input.vehicle_id, input.station_id);
  }

  @Get('station/:station_id')
  @ApiOperation({ summary: 'Retrieve all batteries by station ID' })
  @ApiResponse({ status: 200, description: 'List of batteries for the specified station.' })
  findByStation(@Param('station_id') station_id: string) {
    return this.batteriesService.findAllByStationId(+station_id);
  }

  @ApiOperation({ summary: 'Retrieve a battery by ID' })
  @ApiResponse({ status: 200, description: 'The battery details.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.batteriesService.findOne(+id);
  }

  /**
   * ⭐ SIMULATE BATTERY DISCHARGE - Giả lập driver di chuyển
   * POST /batteries/simulate-discharge
   * Giảm current_charge của battery để simulate việc sử dụng
   */
  @Post('simulate-discharge')
  simulateDischarge(@Body() dto: SimulateBatteryDischargeDto) {
    return this.batteriesService.simulateDischarge(
      dto.battery_id,
      dto.new_charge,
      dto.decrease_amount
    );
  }

  /**
   * ⭐ SET BATTERY CHARGE - Set charge cụ thể (admin)
   * PATCH /batteries/set-charge
   * Set current_charge của battery đến giá trị cụ thể
   */
  @Patch('set-charge')
  setBatteryCharge(@Body() dto: SetBatteryChargeDto) {
    return this.batteriesService.setBatteryCharge(
      dto.battery_id,
      dto.charge_percentage
    );
  }

  /**
   * ⭐ SIMULATE BATTERY CHARGING - Giả lập sạc pin
   * POST /batteries/simulate-charging
   * Tăng current_charge của battery (dành cho battery đang charging)
   */
  @Post('simulate-charging')
  simulateCharging(@Body() body: SimulateChargeForStationDto) {
    return this.batteriesService.simulateCharging(
      body.station_id,
      body.increase_amount
    );
  }

  /**
   * ⭐ MARK BATTERY AS REPAIRED - Đánh dấu pin đã sửa xong
   * POST /batteries/:id/mark-repaired
   * Allow defective batteries to return to service
   */
  @Post(':id/mark-repaired')
  markBatteryRepaired(@Param('id') id: string) {
    return this.batteriesService.markBatteryRepaired(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.batteriesService.remove(+id);
  }
}
