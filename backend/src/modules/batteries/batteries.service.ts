import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CreateBatteryDto } from './dto/create-battery.dto';
import { UpdateBatteryDto } from './dto/update-battery.dto';
import { DatabaseService } from '../database/database.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { BatteryStatus } from '@prisma/client';
import { StationsService } from '../stations/stations.service';
import { findBatteryAvailibleForTicket } from './dto/find-availiable-batteries-ticket.dto';
import { BatteriesGateway } from './batteries.gateway';

@Injectable()
export class BatteriesService {
  constructor(
    private databaseService: DatabaseService,
    private vehiclesService: VehiclesService,
    private stationsService: StationsService,
    private batteriesGateway: BatteriesGateway,
  ) { }

  private readonly logger = new Logger(BatteriesService.name);

  /**
   * Validate status transitions to prevent invalid state changes
   * Returns true if transition is valid, throws error otherwise
   */
  private validateStatusTransition(
    currentStatus: BatteryStatus,
    newStatus: BatteryStatus,
    battery?: any
  ): void {
    // Define valid status transitions
    const validTransitions: Record<BatteryStatus, BatteryStatus[]> = {
      full: [BatteryStatus.in_use, BatteryStatus.booked, BatteryStatus.defective, BatteryStatus.in_transit],
      in_use: [BatteryStatus.charging, BatteryStatus.defective],
      charging: [BatteryStatus.full, BatteryStatus.defective],
      booked: [BatteryStatus.full, BatteryStatus.defective],
      defective: [BatteryStatus.charging, BatteryStatus.full],
      in_transit: [BatteryStatus.full, BatteryStatus.charging, BatteryStatus.defective],
    };

    // Check if transition is valid
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition: ${currentStatus} → ${newStatus}. ` +
        `Valid transitions from ${currentStatus}: ${validTransitions[currentStatus]?.join(', ') || 'none'}`
      );
    }

    // Additional validation: cannot set to 'full' if charge < 100%
    if (newStatus === BatteryStatus.full && battery) {
      const charge = Number(battery.current_charge);
      if (charge < 100) {
        throw new BadRequestException(
          `Cannot set status to 'full' when battery charge is ${charge}%. Must be 100%.`
        );
      }
    }

    this.logger.log(`Status transition validated: ${currentStatus} → ${newStatus}`);
  }

  create(createBatteryDto: CreateBatteryDto) {
    try {
      const newBattery = this.databaseService.battery.create({
        data: {
          ...createBatteryDto,
        },
      });
      return newBattery;
    } catch (error) {
      throw error;
    }
  }

  findAll() {
    return this.databaseService.battery.findMany();
  }

  async findAllByStationId(station_id: number) {
    return await this.databaseService.battery.findMany({
      where: { station_id },
    });
  }

  async findCompatibleBatteries(
    model: string,
    type: string,
    status: BatteryStatus = 'full',
  ) {
    return await this.databaseService.battery.findMany({
      where: {
        model,
        type,
        status
      }
    });
  }

  async findBestBatteryForVehicle(
    vehicle_id: number,
    station_id: number,
  ) {

    const { battery_model, battery_type } = await this.vehiclesService.findOne(vehicle_id);

    if (!battery_model || !battery_type) {
      throw new NotFoundException('Vehicle not found or missing battery model/type');
    }

    const bestBattery = await this.databaseService.battery.findFirst({
      where: {
        station_id,
        model: battery_model,
        type: battery_type,
        status: 'full'
      },
      orderBy: {
        soh: 'desc'
      }
    });

    if (!bestBattery) {
      throw new NotFoundException('No compatible battery found');
    }

    return bestBattery;
  }

  async findOne(id: number) {
    const battery = await this.databaseService.battery.findUnique({
      where: { battery_id: id },
    });
    if (!battery) {
      throw new NotFoundException(`Battery with ID ${id} not found`);
    }
    return battery;
  }

  async findBatteryAvailibleForTicket(dto: findBatteryAvailibleForTicket) {
    const availableBatteries = await this.databaseService.battery.findMany({
      where: {
        model: dto.model,
        type: dto.type,
        station_id: dto.station_id,
        status: dto.status
      },
      take: dto.quantity, // Giới hạn theo số lượng cần
      select: {
        battery_id: true,
        model: true,
        type: true,
        soh: true,
        status: true,
        station_id: true,
      },
    });

    return availableBatteries;
  }

  async assignBatteryToVehicle(
    battery_id: number,
    vehicle_id: number,
    tx?: any // transaction instance
  ) {
    try {
      const db = tx ?? this.databaseService;

      const battery = await this.findOne(battery_id);
      if (!battery) {
        throw new NotFoundException(`Battery with ID ${battery_id} not found`);
      }

      if (battery.status !== 'full') {
        throw new BadRequestException(`Battery with ID ${battery_id} is not full`);
      }

      // Check if vehicle exists
      const vehicle = await this.vehiclesService.findOne(vehicle_id);
      if (!vehicle) {
        throw new NotFoundException(`Vehicle with ID ${vehicle_id} not found`);
      }

      // Ensure no other battery is currently assigned to this vehicle (avoid unique constraint)
      await db.battery.updateMany({
        where: { vehicle_id },
        data: { vehicle_id: null },
      });

      // ✅ CONSOLIDATED: Assign battery to vehicle (updates BOTH sides in one method)
      this.logger.log(`Assigning battery ${battery_id} to vehicle ${vehicle_id}`);

      // Update battery side
      const updatedBattery = await db.battery.update({
        where: { battery_id },
        data: { vehicle_id, station_id: null, status: BatteryStatus.in_use },
      });

      // ✅ Update vehicle side (consolidated here to avoid duplicate calls)
      await db.vehicle.update({
        where: { vehicle_id },
        data: { battery_id },
      });

      return updatedBattery;
    } catch (error) {
      this.logger.error(`Error assigning battery to vehicle: ${error.message}`);
      throw error;
    }
  }

  async returnBatteryToStation(
    battery_id: number,
    station_id: number,
    tx?: any // transaction instance
  ) {
    try {
      const db = tx ?? this.databaseService;

      // Check if battery exists
      const battery = await this.findOne(battery_id);
      if (!battery) {
        throw new NotFoundException(`Battery with ID ${battery_id} not found`);
      }

      // ✅ FIXED: Validate current status - only in_use batteries can be returned
      if (battery.status !== BatteryStatus.in_use) {
        throw new BadRequestException(
          `Cannot return battery with status '${battery.status}'. Only batteries with status 'in_use' can be returned to station.`
        );
      }

      // Check if station exists
      const station = await this.stationsService.findOne(station_id);
      if (!station) {
        throw new NotFoundException(`Station with ID ${station_id} not found`);
      }

      // ✅ FIXED: Smart status selection based on charge level
      const currentCharge = Number(battery.current_charge);
      const targetStatus = currentCharge >= 100
        ? BatteryStatus.full
        : BatteryStatus.charging;

      // Return battery to station
      this.logger.log(
        `Returning battery ID ${battery_id} (charge: ${currentCharge}%) to station ID ${station_id} with status '${targetStatus}'`
      );
      return await db.battery.update({
        where: { battery_id },
        data: {
          station_id,
          vehicle_id: null,
          status: targetStatus
        },
      });
    } catch (error) {
      this.logger.error(`Error returning battery to station: ${error.message}`);
      throw error;
    }
  }

  async updateBatteryStatus(
    id: number,
    status: BatteryStatus,
    tx?: any,
    skipValidation: boolean = false // Admin override
  ) {
    const prisma = tx ?? this.databaseService;
    const battery = await this.findOne(id);

    if (!battery) {
      throw new NotFoundException(`Battery with ID ${id} not found`);
    }

    // Store previous status for WebSocket event
    const previousStatus = battery.status;

    // ✅ FIXED: Validate status transitions unless explicitly skipped
    if (!skipValidation) {
      this.validateStatusTransition(battery.status, status, battery);
    }

    const updatedBattery = await prisma.battery.update({
      where: { battery_id: id },
      data: { status },
      include: {
        station: {
          select: {
            station_id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(
      `Updated battery ID ${id} from ${battery.status} to status ${status}` +
      (skipValidation ? ' (validation skipped)' : '')
    );

    // 🔥 Emit WebSocket event for battery status change
    if (previousStatus !== status) {
      this.batteriesGateway.notifyBatteryStatusChanged({
        batteryId: updatedBattery.battery_id,
        stationId: updatedBattery.station_id,
        stationName: updatedBattery.station?.name || 'Unknown',
        previousStatus: previousStatus,
        currentStatus: status,
        currentCharge: Number(updatedBattery.current_charge),
        timestamp: new Date().toISOString(),
      });
    }

    return updatedBattery;
  }

  async update(id: number, updateBatteryDto: UpdateBatteryDto, tx?: any) {
    try {
      const prisma = tx ?? this.databaseService;

      const battery = await this.findOne(id);

      const updatedBattery = await prisma.battery.update({
        where: { battery_id: id },
        data: {
          ...updateBatteryDto,
        },
      });

      this.logger.log(`Battery ID ${id} updated successfully`);
      return updatedBattery;
    } catch (error) {
      throw error;
    }
  }

  remove(id: number) {
    return `This action removes a #${id} battery`;
  }

  /**
   * Simulate battery discharge (driver di chuyển)
   * Giảm current_charge của battery
   */
  async simulateDischarge(battery_id: number, new_charge?: number, decrease_amount?: number) {
    const battery = await this.findOne(battery_id);

    if (battery.status !== BatteryStatus.in_use) {
      throw new BadRequestException(
        `Cannot simulate discharge for battery with status ${battery.status}. Only batteries in_use can be discharged.`
      );
    }

    let targetCharge: number;

    if (new_charge !== undefined) {
      // Sử dụng new_charge được cung cấp
      targetCharge = new_charge;
    } else if (decrease_amount !== undefined) {
      // Giảm theo số lượng cụ thể
      targetCharge = Math.max(0, Number(battery.current_charge) - decrease_amount);
    } else {
      // Random decrease 5-20%
      const randomDecrease = Math.floor(Math.random() * 16) + 5; // 5-20
      targetCharge = Math.max(0, Number(battery.current_charge) - randomDecrease);
    }

    const updatedBattery = await this.databaseService.battery.update({
      where: { battery_id },
      data: { current_charge: targetCharge },
      include: {
        vehicle: {
          select: {
            vehicle_id: true,
            vin: true,
            user_id: true,
          },
        },
      },
    });

    this.logger.log(
      `Battery ${battery_id} discharged from ${battery.current_charge}% to ${targetCharge}%`
    );

    return {
      battery_id: updatedBattery.battery_id,
      previous_charge: Number(battery.current_charge),
      current_charge: Number(updatedBattery.current_charge),
      decrease_amount: Number(battery.current_charge) - targetCharge,
      status: updatedBattery.status,
      vehicle: updatedBattery.vehicle,
      message: `Battery discharged from ${battery.current_charge}% to ${targetCharge}%`,
    };
  }

  /**
   * Set battery charge to specific value (admin only)
   * Dùng để test hoặc admin điều chỉnh
   * ✅ FIXED: Auto-update status based on charge level
   */
  async setBatteryCharge(battery_id: number, charge_percentage: number) {
    const battery = await this.findOne(battery_id);

    const previousCharge = Number(battery.current_charge);
    const previousStatus = battery.status;
    let newStatus = battery.status;

    // ✅ FIXED: Auto-adjust status based on charge level
    if (charge_percentage >= 100 && battery.status === BatteryStatus.charging) {
      // Battery fully charged → auto set to 'full'
      newStatus = BatteryStatus.full;
      this.logger.log(`Auto-updating status: charging → full (charge reached 100%)`);
    } else if (charge_percentage < 100 && battery.status === BatteryStatus.full) {
      // Battery no longer full → auto set to 'charging' if at station
      if (battery.station_id) {
        newStatus = BatteryStatus.charging;
        this.logger.log(`Auto-updating status: full → charging (charge dropped below 100%)`);
      }
    }

    const updatedBattery = await this.databaseService.battery.update({
      where: { battery_id },
      data: {
        current_charge: charge_percentage,
        status: newStatus // ✅ Update status if changed
      },
      include: {
        vehicle: {
          select: {
            vehicle_id: true,
            vin: true,
            user_id: true,
          },
        },
        station: {
          select: {
            station_id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(
      `Battery ${battery_id} charge set from ${previousCharge}% to ${charge_percentage}%` +
      (newStatus !== battery.status ? ` (status: ${battery.status} → ${newStatus})` : '')
    );

    // 🔥 Emit WebSocket event for battery charge update
    this.batteriesGateway.notifyBatteryChargeUpdated({
      batteryId: updatedBattery.battery_id,
      stationId: updatedBattery.station_id,
      previousCharge: previousCharge,
      currentCharge: charge_percentage,
      chargeChange: charge_percentage - previousCharge,
      status: updatedBattery.status,
      timestamp: new Date().toISOString(),
    });

    // 🔥 Emit status change event if status changed
    if (previousStatus !== newStatus) {
      this.batteriesGateway.notifyBatteryStatusChanged({
        batteryId: updatedBattery.battery_id,
        stationId: updatedBattery.station_id,
        stationName: updatedBattery.station?.name || 'Unknown',
        previousStatus: previousStatus,
        currentStatus: newStatus,
        currentCharge: charge_percentage,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      battery_id: updatedBattery.battery_id,
      previous_charge: previousCharge,
      current_charge: Number(updatedBattery.current_charge),
      change_amount: charge_percentage - previousCharge,
      status: updatedBattery.status,
      vehicle: updatedBattery.vehicle,
      station: updatedBattery.station,
      message: `Battery charge set to ${charge_percentage}%`,
    };
  }

  /**
   * Simulate charging battery (tăng charge)
   * Dùng khi battery đang charging tại station
   */
  async simulateCharging(station_id: number, increase_amount?: number) {
    // Validate station exists
    const station = await this.stationsService.findOne(station_id);
    if (!station) {
      throw new NotFoundException(`Station with ID ${station_id} not found`);
    }

    // Find all batteries at station with status 'charging'
    const chargingBatteries = await this.databaseService.battery.findMany({
      where: {
        station_id,
        status: BatteryStatus.charging,
        current_charge: {
          lt: 100, // Only batteries with charge < 100%
        },
      },
    });

    if (chargingBatteries.length === 0) {
      return {
        station_id,
        station_name: station.name,
        batteries_charged: 0,
        message: 'No batteries available for charging at this station',
      };
    }

    // Charge each battery
    const results = await Promise.all(
      chargingBatteries.map(async (battery) => {
        const currentCharge = Number(battery.current_charge);
        const increaseBy = increase_amount ?? Math.floor(Math.random() * 21) + 10; // 10-30% random
        const targetCharge = Math.min(100, currentCharge + increaseBy);

        const updatedBattery = await this.databaseService.battery.update({
          where: { battery_id: battery.battery_id },
          data: {
            current_charge: targetCharge,
            status: targetCharge >= 100 ? BatteryStatus.full : BatteryStatus.charging,
          },
        });

        this.logger.log(
          `Battery ${battery.battery_id} charged from ${currentCharge}% to ${targetCharge}%`
        );

        return {
          battery_id: updatedBattery.battery_id,
          previous_charge: currentCharge,
          current_charge: Number(updatedBattery.current_charge),
          increase_amount: targetCharge - currentCharge,
          status: updatedBattery.status,
          is_full: targetCharge >= 100,
        };
      })
    );

    const fullyChargedCount = results.filter((r) => r.is_full).length;
    const stillChargingCount = results.length - fullyChargedCount;

    return {
      station_id,
      station_name: station.name,
      batteries_charged: results.length,
      fully_charged: fullyChargedCount,
      still_charging: stillChargingCount,
      batteries: results,
      message: `Charged ${results.length} batteries at station. ${fullyChargedCount} reached full capacity.`,
    };
  }

  /**
   * Mark battery as repaired (defective recovery workflow)
   * ✅ NEW: Allow defective batteries to return to service
   */
  async markBatteryRepaired(battery_id: number) {
    const battery = await this.findOne(battery_id);

    // Validate current status
    if (battery.status !== BatteryStatus.defective) {
      throw new BadRequestException(
        `Cannot mark battery as repaired. Battery status is '${battery.status}', must be 'defective'.`
      );
    }

    // Battery must be at a station to be repaired
    if (!battery.station_id) {
      throw new BadRequestException(
        'Battery must be at a station to be repaired. Please return battery to station first.'
      );
    }

    // After repair, reset charge to 0 and set to charging
    const updatedBattery = await this.databaseService.battery.update({
      where: { battery_id },
      data: {
        status: BatteryStatus.charging,
        current_charge: 0, // Reset charge after repair
      },
      include: {
        station: {
          select: {
            station_id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(
      `Battery ${battery_id} marked as repaired at station ${battery.station_id}. Status: defective → charging, charge reset to 0%`
    );

    return {
      battery_id: updatedBattery.battery_id,
      previous_status: 'defective',
      current_status: updatedBattery.status,
      current_charge: Number(updatedBattery.current_charge),
      station: updatedBattery.station,
      message: 'Battery successfully repaired and ready for charging',
    };
  }
}
