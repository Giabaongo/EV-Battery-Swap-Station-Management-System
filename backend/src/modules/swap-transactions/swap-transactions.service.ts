import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { CreateSwapTransactionDto } from './dto/create-swap-transaction.dto';
import { UpdateSwapTransactionDto } from './dto/update-swap-transaction.dto';
import { UsersService } from '../users/users.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { StationsService } from '../stations/stations.service';
import { BatteriesService } from '../batteries/batteries.service';
import { DatabaseService } from '../database/database.service';
import { BatteryStatus, SwapTransactionStatus } from '@prisma/client';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';


@Injectable()
export class SwapTransactionsService {
  private readonly logger = new Logger(SwapTransactionsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly usersService: UsersService,
    private readonly vehiclesService: VehiclesService,
    private readonly stationsService: StationsService,
    private readonly batteriesService: BatteriesService,
    private readonly subcriptionsService: SubscriptionsService,
  ) { }

  async create(
    createDto: CreateSwapTransactionDto,
    tx?: any // transaction object
  ) {
    const [user, vehicle, station, battery_returned, subscription] = await Promise.all([
      this.usersService.findOneById(createDto.user_id),
      this.vehiclesService.findOne(createDto.vehicle_id),
      this.stationsService.findOne(createDto.station_id),
      this.batteriesService.findOne(createDto.battery_returned_id),
      this.subcriptionsService.findOne(createDto.subscription_id),
    ]);

    const prisma = tx || this.databaseService;

    try {
      const battery_returned = await this.batteriesService.findOne(createDto.battery_returned_id);

      if (vehicle.user_id !== createDto.user_id) {
        throw new BadRequestException({ message: `Vehicle with ID ${vehicle.vehicle_id} not owned by user with ID ${createDto.user_id}` });
      }

      if (battery_returned.battery_id !== vehicle.battery_id) {
        throw new BadRequestException({ message: `Battery with ID ${battery_returned.battery_id} not in vehicle with ID ${vehicle.vehicle_id}` });
      }

      if (subscription.user_id !== createDto.user_id) {
        throw new BadRequestException({ message: `Subscription with ID ${subscription.subscription_id} not owned by user with ID ${createDto.user_id}` });
      }

      if (subscription.vehicle_id !== createDto.vehicle_id) {
        throw new NotFoundException({ message: `Subscription with ID ${subscription.subscription_id} not for vehicle with ID ${createDto.vehicle_id}` });
      }

      // Create swap transaction
      this.logger.log(`Creating swap transaction for user ID ${createDto.user_id}, vehicle ID ${createDto.vehicle_id} at station ID ${createDto.station_id}`);
      return await prisma.swapTransaction.create({
        data: {
          user_id: createDto.user_id,
          vehicle_id: createDto.vehicle_id,
          station_id: createDto.station_id,
          cabinet_id: createDto.cabinet_id,
          battery_taken_id: null,
          battery_returned_id: createDto.battery_returned_id,
          subscription_id: createDto.subscription_id,
          status: createDto.status,
        }
      });
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    return await this.databaseService.swapTransaction.findMany({
      orderBy: { createAt: 'desc' }
    });
  }

  findAllByUserId(user_id: number) {
    return this.databaseService.swapTransaction.findMany({
      where: { user_id: user_id },
      orderBy: { createAt: 'desc' }
    });
  }

  async findByStation(station_id: number) {
    return await this.databaseService.swapTransaction.findMany({
      where: { station_id },
      include: {
        user: {
          select: {
            user_id: true,
            email: true,
            username: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            vehicle_id: true,
            vin: true,
            battery_model: true,
            battery_type: true,
            status: true
          }
        },
        station: {
          select: {
            station_id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true
          }
        },
        battery_taken: {
          select: {
            battery_id: true,
            current_charge: true,
            status: true,
            model: true,
            type: true
          }
        },
        battery_returned: {
          select: {
            battery_id: true,
            current_charge: true,
            status: true,
            model: true,
            type: true
          }
        }
      },
      orderBy: { createAt: 'desc' }
    });
  }

  findOne(id: number) {
    return this.databaseService.swapTransaction.findUnique({
      where: { transaction_id: id },
    });
  }

  async findPendingTransactionByVehicle(vehicleId: number) {
    return this.databaseService.swapTransaction.findFirst({
      where: {
        vehicle_id: vehicleId,
        status: SwapTransactionStatus.pending
      }
    });
  }

  async updateStatus(
    id: number,
    status: SwapTransactionStatus
  ) {
    try {
      return await this.databaseService.swapTransaction.update({
        where: { transaction_id: id },
        data: { status: status }
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to update swap transaction status');
    }
  }


  update(id: number, updateSwapTransactionDto: UpdateSwapTransactionDto, tx?: any) {
    const prisma = tx || this.databaseService;
    try {
      const updatedTransaction = prisma.swapTransaction.update({
        where: { transaction_id: id },
        data: { ...updateSwapTransactionDto }
      });
      return updatedTransaction;
    } catch (error) {
      throw error;
    }
  }

  remove(id: number) {
    return `This action removes a #${id} swapTransaction`;
  }
}
