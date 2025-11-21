import { ConflictException, Injectable, NotFoundException, Logger, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { DatabaseService } from '../database/database.service';
import { SubscriptionStatus, VehicleStatus } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userService: UsersService,
    private readonly subscriptionsService: SubscriptionsService
  ) { }

  async create(createVehicleDto: CreateVehicleDto) {
    try {
      const vehicle = await this.databaseService.vehicle.create({
        data: createVehicleDto,
      });

      return vehicle;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('VIN already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return await this.databaseService.vehicle.findMany({
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const vehicle = await this.databaseService.vehicle.findUnique({
      where: { vehicle_id: id },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    return vehicle;
  }

  async findManyByUser(userId: number) {
    const vehicles = await this.databaseService.vehicle.findMany({
      where: { user_id: userId },
      include: {
        battery: {
          select: {
            capacity: true,
            current_charge: true,
            soh: true,
          },
        }
      },
    });

    return vehicles;
  }

  async findOneActiveByUserId(userId: number) {
    const activeVehicle = await this.databaseService.vehicle.findFirst({
      where: {
        user_id: userId,
        status: VehicleStatus.active
      },
    });

    if (!activeVehicle) {
      throw new NotFoundException(`No active vehicle found for user ID ${userId}`);
    }

    return activeVehicle;
  }

  async findByVin(vin: string) {
    const vehicle = await this.databaseService.vehicle.findUnique({
      where: { vin },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with VIN ${vin} not found`);
    }

    return vehicle;
  }

  async updateBatteryId(vehicle_id: number, battery_id: number, tx?: any) {
    const prisma = tx || this.databaseService;

    // ✅ Validate vehicle exists
    const vehicle = await this.findOne(vehicle_id);

    this.logger.log(
      `Updating vehicle ${vehicle_id} with battery ${battery_id}`
    );

    return await prisma.vehicle.update({
      where: { vehicle_id },
      data: { battery_id },
    });
  }

  async removeBatteryFromVehicle(
    vehicle_id: number,
    tx: any // Pass the transaction object
  ) {
    try {
      // ✅ Check if vehicle exists
      const vehicle = await this.findOne(vehicle_id);
      if (!vehicle) {
        throw new NotFoundException(`Vehicle with ID ${vehicle_id} not found`);
      }

      // ✅ Check if vehicle has a battery
      if (!vehicle.battery_id) {
        throw new BadRequestException(
          `Vehicle ${vehicle_id} has no battery to remove`
        );
      }


      this.logger.log(
        `Removing battery ${vehicle.battery_id} from vehicle ${vehicle_id}`
      );

      return await tx.vehicle.update({
        where: { vehicle_id },
        data: { battery_id: null },
      });
    } catch (error) {
      throw error;
    }
  }

  async assignVehicleToUser(
    assignVehicleDto: { vin: string; user_id: number },
  ) {
    try {
      // ✅ Check if user exists
      await this.userService.findOneById(assignVehicleDto.user_id);

      // ✅ Check if vehicle exists
      const vehicle = await this.findByVin(assignVehicleDto.vin);

      // ✅ Check if vehicle is being reassigned (already has owner)
      if (vehicle.user_id && vehicle.user_id !== assignVehicleDto.user_id) {
        // Check for active subscriptions on this vehicle
        const activeSubscriptions = await this.databaseService.subscription.findMany({
          where: {
            vehicle_id: vehicle.vehicle_id,
            status: 'active', // SubscriptionStatus.active
          },
          include: {
            package: {
              select: {
                name: true,
              },
            },
          },
        });

        if (activeSubscriptions.length > 0) {
          const packageNames = activeSubscriptions.map(sub => sub.package.name).join(', ');
          throw new BadRequestException(
            `Cannot reassign vehicle ${vehicle.vin}. ` +
            `Vehicle has ${activeSubscriptions.length} active subscription(s): ${packageNames}. ` +
            `Please cancel all subscriptions before reassigning the vehicle.`
          );
        }

        this.logger.warn(
          `Reassigning vehicle ${vehicle.vin} from user ${vehicle.user_id} to user ${assignVehicleDto.user_id}`
        );
      }

      this.logger.log(
        `Assigned Vehicle with VIN ${assignVehicleDto.vin} to User with ID ${assignVehicleDto.user_id}`
      );

      return await this.databaseService.vehicle.update({
        where: { vin: assignVehicleDto.vin },
        data: { user_id: assignVehicleDto.user_id, status: VehicleStatus.active },
      });
    } catch (error) {
      throw error;
    }
  }

  async removeVehicleFromUser(vin: string, user_id: number) {
    try {
      // ✅ Check if vehicle exists
      const vehicle = await this.findByVin(vin);
      if (vehicle.user_id !== user_id) {
        throw new BadRequestException(
          `Vehicle with VIN ${vin} is not assigned to user ID ${user_id}`
        );
      }

      const removedVehicle = await this.databaseService.vehicle.update({
        where: { vin },
        data: { user_id: null, status: VehicleStatus.inactive },
      });

      return removedVehicle;
    }
    catch (error) {
      throw error;
    }
  }

  async update(id: number, updateVehicleDto: UpdateVehicleDto, tx?: any) {
    const prisma = tx ?? this.databaseService;
    try {
      await this.findOne(id); // Check if vehicle exists
      const updatedVehicle = await prisma.vehicle.update({
        where: { vehicle_id: id },
        data: updateVehicleDto,
        include: {
          user: {
            select: {
              user_id: true,
              username: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return updatedVehicle;
    } catch (error) {
      throw error;
    }
  }
}
