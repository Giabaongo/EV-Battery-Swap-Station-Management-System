import { Controller, Post, Body } from '@nestjs/common';
import { SwappingService } from './swapping.service';
import { SwappingDto } from './dto/swapping.dto';
import { FirstSwapDto } from './dto/first-swap.dto';
import { FindEmptySlotDto } from './dto/find-empty-slot.dto';
import { FindBatteryFullSlotDto } from './dto/find-battery-full-slot';
import { ReturnBatteryDto } from './dto/return-battery.dto';
import { TakeBatteryDto } from './dto/take-battery.dto';

@Controller('swapping')
export class SwappingController {
  constructor(private readonly swappingService: SwappingService) { }

  // ========================
  // STEP 1: RETURN OLD BATTERY
  // ========================

  /**
   * Get available empty slot for returning battery
   * User checks which slot to use before returning
   */
  @Post('get-empty-slot')
  async getEmptySlotForReturnBattery(@Body() findEmptySlotDto: FindEmptySlotDto) {
    return this.swappingService.getEmptySlotForReturnBattery(findEmptySlotDto);
  }

  /**
   * Return old battery to cabinet slot
   * Creates pending swap transaction
   */
  @Post('return-battery')
  async returnBatteryToCabinet(@Body() returnBatteryDto: ReturnBatteryDto) {
    return this.swappingService.returnBatteryToCabinet(returnBatteryDto);
  }

  // ========================
  // STEP 2: TAKE NEW BATTERY
  // ========================

  /**
   * Get available full battery slot for taking
   * Prioritizes reserved battery if exists
   */
  @Post('get-full-slot')
  async getFullSlotForTakenBattery(@Body() findFullSlotDto: FindBatteryFullSlotDto) {
    return this.swappingService.getTakenBatterySlot(findFullSlotDto);
  }

  /**
   * Take new battery from cabinet
   * Completes swap transaction and updates all records
   */
  @Post('take-battery')
  async takeBatteryFromCabinet(@Body() takeBatteryDto: TakeBatteryDto) {
    return this.swappingService.takeBatteryFromCabinet(takeBatteryDto);
  }

  // ========================
  // DEPRECATED/FUTURE ENDPOINTS
  // ========================

  // @Post('automatic-swap')
  // async swapBatteries(@Body() swapDto: SwappingDto) {
  //   return this.swappingService.swapBatteries(swapDto);
  // }

  // @Post('initialize-battery')
  // async initializeBattery(@Body() firstSwapDto: FirstSwapDto) {
  //   return this.swappingService.initializeBattery(firstSwapDto);
  // }
}
