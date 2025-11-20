import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { DatabaseService } from '../database/database.service';
import { SubscriptionStatus, VehicleStatus } from '@prisma/client';
import { BatteryServicePackagesService } from '../battery-service-packages/battery-service-packages.service';
import { ConfigService } from '../config/config.service';
import { FeeCalculationService } from '../payments/services/fee-calculation.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private prisma: DatabaseService,
    private packageService: BatteryServicePackagesService,
    private configService: ConfigService,
    private feeCalculationService: FeeCalculationService,
  ) { }

  async create(createSubscriptionDto: CreateSubscriptionDto) {
    // 1. Check if package exists and is active
    const servicePackage = await this.packageService.findOne(createSubscriptionDto.package_id);

    if (!servicePackage.active) {
      throw new BadRequestException('Package is not active');
    }

    // 2. Check if vehicle exists
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { vehicle_id: createSubscriptionDto.vehicle_id },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // 3. Verify vehicle belongs to user
    if (vehicle.user_id !== createSubscriptionDto.user_id) {
      throw new BadRequestException('Vehicle does not belong to this user');
    }

    // 4. Check if this VEHICLE already has ANY active subscription
    // Rule: Vehicle can only have ONE active subscription at a time
    const existingSubscription = await this.findOneByVehicleId(createSubscriptionDto.vehicle_id);

    if (existingSubscription && existingSubscription.status === SubscriptionStatus.active) {
      throw new ConflictException(
        `This vehicle already has an active subscription (${existingSubscription.package.name}). Please cancel it first before creating a new one.`,
      );
    }

    // 5. Calculate end date based on duration_days
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + servicePackage.duration_days);

    // 6. Create subscription and activate vehicle in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create subscription
      const subscription = await tx.subscription.create({
        data: {
          user_id: createSubscriptionDto.user_id,
          package_id: createSubscriptionDto.package_id,
          vehicle_id: createSubscriptionDto.vehicle_id,
          start_date: startDate,
          end_date: endDate,
          status: SubscriptionStatus.active,
          swap_used: 0,
        },
        include: {
          package: true,
          user: {
            select: {
              user_id: true,
              username: true,
              email: true,
              phone: true,
            },
          },
          vehicle: true,
        },
      });

      // Activate vehicle
      await tx.vehicle.update({
        where: { vehicle_id: createSubscriptionDto.vehicle_id },
        data: { status: VehicleStatus.active },
      });

      this.logger.log(
        `Vehicle ${vehicle.vin} (ID: ${vehicle.vehicle_id}) activated for subscription ${subscription.subscription_id}`,
      );

      return subscription;
    });

    return result;
  }

  async findAll() {
    return this.prisma.subscription.findMany({
      include: {
        package: true,
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            phone: true,
          },
        },
        vehicle: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }


  async findOne(id: number, user?: any) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { subscription_id: id },
      include: {
        package: true,
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            phone: true,
          },
        },
        vehicle: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    // Authorization check: If user is driver, they can only access their own subscriptions
    if (user && user.role === 'driver') {
      if (subscription.user_id !== user.sub) {
        throw new ForbiddenException(
          'You do not have permission to access this subscription',
        );
      }
    }

    return subscription;
  }

  async findOneByVehicleId(vehicleId: number) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        vehicle_id: vehicleId,
      },
      include: {
        package: true
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription for vehicle ID ${vehicleId} not found`);
    }

    return subscription;
  }

  async findByUser(userId: number) {
    return this.prisma.subscription.findMany({
      where: { user_id: userId },
      include: {
        package: true,
        vehicle: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findActiveByUser(userId: number) {
    return this.prisma.subscription.findMany({
      where: {
        user_id: userId,
        status: SubscriptionStatus.active,
      },
      include: {
        package: true,
        vehicle: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async update(id: number, updateSubscriptionDto: UpdateSubscriptionDto, prisma?: any) {
    // Check if subscription exists
    await this.findOne(id);
    
    const db = prisma ?? this.prisma;

    return this.prisma.subscription.update({
      where: { subscription_id: id },
      data: updateSubscriptionDto,
      include: {
        package: true,
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            phone: true,
          },
        },
        vehicle: true,
      },
    });
  }

  async cancel(id: number) {
    // Check if subscription exists and is active
    const subscription = await this.findOne(id);

    if (subscription.status !== SubscriptionStatus.active) {
      throw new BadRequestException('Subscription is not active');
    }

    // Cancel subscription and deactivate vehicle if no other active subscriptions
    const result = await this.prisma.$transaction(async (tx) => {
      // Cancel the subscription
      const cancelled = await tx.subscription.update({
        where: { subscription_id: id },
        data: {
          status: SubscriptionStatus.cancelled,
        },
        include: {
          package: true,
          user: {
            select: {
              user_id: true,
              username: true,
              email: true,
              phone: true,
            },
          },
          vehicle: true,
        },
      });

      // Only deactivate vehicle if vehicle_id exists
      if (subscription.vehicle_id) {
        // Check if vehicle has any other active subscriptions
        const otherActiveSubscriptions = await tx.subscription.findFirst({
          where: {
            vehicle_id: subscription.vehicle_id,
            subscription_id: { not: id },
            status: SubscriptionStatus.active,
          },
        });

        // If no other active subscriptions, deactivate the vehicle
        if (!otherActiveSubscriptions) {
          await tx.vehicle.update({
            where: { vehicle_id: subscription.vehicle_id },
            data: { status: VehicleStatus.inactive },
          });

          this.logger.log(
            `Vehicle ID ${subscription.vehicle_id} deactivated after cancelling subscription ${id}`,
          );
        } else {
          this.logger.log(
            `Vehicle ID ${subscription.vehicle_id} remains active (has other active subscriptions)`,
          );
        }
      }

      return cancelled;
    });

    return result;
  }

  async incrementSwapUsed(id: number, tx?: any) {
    const db = tx ?? this.prisma;
    try {
      const subscription = await this.findOne(id);

      // Check if subscription is active
      if (subscription.status !== SubscriptionStatus.active) {
        throw new BadRequestException('Subscription is not active');
      }

      this.logger.log(`Incrementing swap used for subscription ID ${id}. Current swap used: ${subscription.swap_used}`);
      const updatedSubscription = await db.subscription.update({
        where: { subscription_id: id },
        data: {
          swap_used: {
            increment: 1,
          },
        },
        include: {
          package: true,
          user: {
            select: {
              user_id: true,
              username: true,
              email: true,
              phone: true,
            },
          },
          vehicle: true,
        },
      });
      return updatedSubscription;
    } catch (error) {
      throw error;
    }
  }

  async updateDistanceTraveled(id: number, distance: number, tx?: any) {
    const db = tx ?? this.prisma;
    const subscription = await this.findOne(id);
    // Check if subscription is active
    if (subscription.status !== SubscriptionStatus.active) {
      throw new BadRequestException('Subscription is not active');
    }

    // Đảm bảo distance là số hợp lệ
    if (distance < 0) {
      throw new BadRequestException('Distance traveled cannot be negative');
    }

    this.logger.log(`Updating distance traveled for subscription ID ${id}. Adding distance: ${distance} km`);
    return db.subscription.update({
      where: { subscription_id: id },
      data: {
        distance_traveled: {
          increment: distance,
        },
      },
      include: {
        package: true,
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            phone: true,
          },
        },
        vehicle: true,
      },
    });
  }

  async updateExpiredSubscriptions(): Promise<{ count: number; subscriptions: any[] }> {
    const now = new Date();

    // Find all active subscriptions that have expired
    const expiredSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.active,
        end_date: {
          lt: now,
        },
      },
      include: {
        package: true,
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
        vehicle: true,
      },
    });

    if (expiredSubscriptions.length === 0) {
      this.logger.log('No expired subscriptions found at this time.');
      return {
        count: 0,
        subscriptions: [],
      };
    }

    const expiredIds = expiredSubscriptions.map(sub => sub.subscription_id);

    // Subscriptions that have exceeded base distance and need penalty payment
    const needPaymentIds = expiredSubscriptions
      .filter(sub => sub.distance_traveled > sub.package.base_distance)
      .map(sub => sub.subscription_id);

    // Use transaction to update subscriptions and deactivate vehicles
    await this.prisma.$transaction(async (tx) => {
      // Mark subscriptions as expired
      await tx.subscription.updateMany({
        where: {
          subscription_id: { in: expiredIds },
        },
        data: {
          status: SubscriptionStatus.expired,
        },
      });
      this.logger.log(`Marked ${expiredIds.length} subscriptions as expired.`);

      // Mark subscriptions with penalty as pending payment
      await tx.subscription.updateMany({
        where: {
          subscription_id: { in: needPaymentIds },
        },
        data: {
          status: SubscriptionStatus.pending_penalty_payment,
        },
      });
      this.logger.log(`Marked ${needPaymentIds.length} subscriptions as pending penalty payment.`);

      // Deactivate vehicles that no longer have active subscriptions
      const vehicleIds = expiredSubscriptions
        .map(sub => sub.vehicle_id)
        .filter((id): id is number => id !== null);

      for (const vehicleId of vehicleIds) {
        // Check if vehicle still has any active subscription
        const stillActive = await tx.subscription.findFirst({
          where: {
            vehicle_id: vehicleId,
            status: SubscriptionStatus.active,
          },
        });

        // If no active subscription, deactivate vehicle
        if (!stillActive) {
          await tx.vehicle.update({
            where: { vehicle_id: vehicleId },
            data: { status: VehicleStatus.inactive },
          });

          this.logger.log(`Vehicle ID ${vehicleId} deactivated (no active subscriptions)`);
        }
      }
    });

    this.logger.log(`Expired ${expiredSubscriptions.length} subscriptions.`);
    return {
      count: expiredSubscriptions.length,
      subscriptions: expiredSubscriptions.map(sub => ({
        subscription_id: sub.subscription_id,
        user_id: sub.user_id,
        username: sub.user.username,
        package_name: sub.package.name,
        end_date: sub.end_date,
      })),
    };
  }

  remove(id: number) {
    return this.prisma.subscription.delete({
      where: { subscription_id: id },
    });
  }

  async calculatePenaltyFee(id: number): Promise<number> {
    const subscription = await this.findOne(id);

    // Check if subscription is expired
    if (subscription.status !== SubscriptionStatus.expired) {
      throw new BadRequestException('Subscription is not expired');
    }

    // Calculate penalty fee
    //TODO: chỉnh lại phí phạt
    const penaltyFee = subscription.distance_traveled * subscription.package.penalty_fee;

    return penaltyFee;
  }

  /**
   * Renew an expired subscription
   * - Create new subscription with extended period
   * - Calculate penalty fee if distance exceeded base_distance
   * - Mark old subscription as renewed
   */
  async renewSubscription(
    subscriptionId: number,
    vehicle_id: number,
  ): Promise<{
    success: boolean;
    reNewSubscription: any;
    penaltyFee: number;
    message: string;
  }> {
    try {
      // 1. Get old subscription
      const oldSubscription = await this.findOne(subscriptionId);

      if (oldSubscription.status !== SubscriptionStatus.expired) {
        throw new BadRequestException('Only expired subscriptions can be renewed');
      }

      // 2. Check if distance exceeded base_distance (calculate penalty)
      let penaltyFee = await this.feeCalculationService.calculateOverchargeFee(
        oldSubscription.distance_traveled,
      );

      // 3. Create new subscription with reset counters
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + oldSubscription.package.duration_days);

      this.logger.log(`Renewing subscription ID ${subscriptionId} for vehicle ID ${vehicle_id}. New period: ${startDate.toISOString()} - ${endDate.toISOString()}. Penalty fee: ${penaltyFee.overcharge_fee}`);
      //4. Update old subscription
      const reNewSubscription = await this.prisma.$transaction(async (tx) => {
        const subscription = await tx.subscription.update({
          where: { subscription_id: subscriptionId },
          data: {
            vehicle_id: vehicle_id,
            start_date: startDate,
            end_date: endDate,
            status: SubscriptionStatus.active,
            swap_used: 0, // Reset swap counter
            distance_traveled: 0, // Reset distance counter
            deposit_paid: oldSubscription.deposit_paid, // Keep deposit status
          },
          include: {
            package: true,
            user: {
              select: {
                user_id: true,
                username: true,
                email: true,
                phone: true,
              },
            },
            vehicle: true,
          },
        });
        this.logger.log(
          `Subscription ${subscriptionId} renewed. New subscription ID: ${subscription.subscription_id}. Penalty: ${penaltyFee}`,
        );

        return subscription;
      });

      return {
        success: true,
        reNewSubscription,
        penaltyFee: penaltyFee.overcharge_fee,
        message: `Subscription renewed successfully${penaltyFee.overcharge_fee > 0 ? ` with penalty fee: ${penaltyFee.overcharge_fee.toLocaleString('vi-VN')} VND` : ''}`,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Renew subscription with payment (integrated with payment system)
   * - Calculate total amount: package price + penalty fee (if any)
   * - Create new subscription after successful renewal payment
   */
  async renewSubscriptionWithPayment(
    subscriptionId: number,
  ): Promise<{
    oldSubscription: any;
    renewalCost: {
      basePrice: number;
      penaltyFee: number;
      totalAmount: number;
    };
  }> {
    // 1. Get old subscription
    const oldSubscription = await this.findOne(subscriptionId);

    if (oldSubscription.status !== SubscriptionStatus.expired) {
      throw new BadRequestException('Only expired subscriptions can be renewed');
    }

    // 2. Calculate penalty fee
    const overchargeCost = await this.feeCalculationService.calculateOverchargeFee(
      oldSubscription.subscription_id,
    );

    const penaltyFee = overchargeCost.overcharge_fee;

    const distanceTraveled = oldSubscription.distance_traveled;

    // 3. Calculate total renewal cost
    const basePrice = oldSubscription.package?.base_price.toNumber() || 0;
    const totalAmount = basePrice + penaltyFee;

    return {
      oldSubscription,
      renewalCost: {
        basePrice,
        penaltyFee,
        totalAmount,
      },
    };
  }
}
