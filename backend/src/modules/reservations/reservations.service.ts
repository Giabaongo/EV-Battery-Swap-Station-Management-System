import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { BatteriesService } from '../batteries/batteries.service';
import { DatabaseService } from '../database/database.service';
import { BatteryStatus, ReservationStatus, SubscriptionStatus } from '@prisma/client';
import { VehiclesService } from '../vehicles/vehicles.service';
import { UsersService } from '../users/users.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ConfigService } from '@nestjs/config';
import { StationsService } from '../stations/stations.service';

@Injectable()
export class ReservationsService {
  private logger = new Logger(ReservationsService.name);

  constructor(
    private batteriesService: BatteriesService,
    private databaseService: DatabaseService,
    private vehicleService: VehiclesService,
    private userService: UsersService,
    private subscriptionsService: SubscriptionsService,
    private stationsService: StationsService,
    private configService: ConfigService
  ) { }


  async create(dto: CreateReservationDto) {
    const { user_id, vehicle_id, station_id, scheduled_time } = dto;

    try {
      //1. Check user có tồn tại
      const user = await this.userService.findOneById(user_id);

      const station = await this.stationsService.findOne(station_id);

      const vehicle = await this.vehicleService.findOne(vehicle_id);
      if (vehicle.user_id !== user_id) {
        throw new BadRequestException('This vehicle does not belong to the user');
      }

      const subscription = await this.subscriptionsService.findOneByVehicleId(vehicle.vehicle_id);

      // 2. Check user có penalty ko
      if (subscription.status === SubscriptionStatus.pending_penalty_payment) {
        throw new BadRequestException('You have to pay the penalty for this subscription before making a new reservation');
      }

      // 3. Check xe có gói cước active
      if (subscription.status !== SubscriptionStatus.active) {
        this.logger.warn(`Vehicle ID ${vehicle.vehicle_id} does not have an active subscription`);
        throw new BadRequestException('Vehicle does not have an active subscription');
      }

      // 3. tìm pin phù hợp với xe tại trạm 
      const reservationBattery = await this.batteriesService.findBestBatteryForVehicle(vehicle.vehicle_id, station_id);

      //4. chuyển status của battery được d
      const updatedBattery = await this.batteriesService.update(reservationBattery.battery_id, {
        status: BatteryStatus.booked
      });

      const cabinet = await this.cabinetsService.findOneCabinet(updatedBattery.cabinet_id);

      if (cabinet.station_id !== station_id) {
        throw new BadRequestException('No compatible battery available at this station for your vehicle');
      }

      const slot = await this.cabinetsService.findEmptySlotAtCabinet(cabinet.cabinet_id);


      const now = new Date();
      // chuyển string sang date
      const scheduledTime = new Date(scheduled_time);
      const maxAllowedMinutes = this.configService.get<number>('RESERVATION_MAX_TIME') || 60;
      const maxAllowed = new Date(now.getTime() + maxAllowedMinutes * 60 * 1000);

      // 4. kiểm tra đặt lịch trong quá khứ
      if (scheduledTime < now) {
        throw new BadRequestException('Cannot not schedule in the past')
      }

      // 5. kiểm tra đặt quá giờ cho phép.(max = 1 giờ)
      if (scheduledTime > maxAllowed) {
        throw new BadRequestException(`Scheduled time exceeds the maximum allowed limit of ${maxAllowedMinutes} minutes from now`);
      }

      //6. kiểm tra user có đặt lịch trùng 
      const existing = await this.databaseService.reservation.findFirst({
        where: {
          user_id: user_id,
          vehicle_id: vehicle.vehicle_id,
          status: ReservationStatus.scheduled
        }
      })

      if (existing) {
        throw new BadRequestException('You already have a reservation for this vehicle at this time');
      }


      //7. tạo lịch nếu các params hợp lệ
      const newReservation = await this.databaseService.reservation.create({
        data: {
          user_id: user_id,
          vehicle_id: vehicle.vehicle_id,
          battery_id: reservationBattery.battery_id,
          station_id: station_id,
          scheduled_time: scheduled_time,
          status: ReservationStatus.scheduled
        }
      });

      this.logger.log(`New reservation created with ID ${newReservation.reservation_id} for user ID ${user_id} at station ID ${station_id}`);

      const payload: ReservationCreatedEvent = {
        reservationId: newReservation.reservation_id,
        stationId: station.station_id,
        stationName: station.name,
        scheduledTime: newReservation.scheduled_time.toISOString(),
        batteryId: reservationBattery.battery_id,
        vehicle: {
          id: vehicle.vehicle_id,
          vin: vehicle.vin,
          batteryModel: vehicle.battery_model,
          batteryType: vehicle.battery_type
        },
        user: {
          id: user.user_id,
          username: user.username,
          email: user.email,
          phone: user.phone
        }
      };

      this.reservationsGateway.notifyReservationCreated(payload);

      return {
        reservation: newReservation,
        cabinet: cabinet,
        slot: slot,
        battery: updatedBattery
      };
    } catch (error) {
      throw error;
    }
  }

  findAll() {
    return `This action returns all reservations`;
  }

  async findManyByUserId(userId: number) {
    return await this.databaseService.reservation.findMany({
      where: { user_id: userId },
      orderBy: { scheduled_time: 'desc' }
    });
  }

  async findManyByStationId(stationId: number) {
    return await this.databaseService.reservation.findMany({
      where: { station_id: stationId },
      orderBy: { scheduled_time: 'desc' }
    });
  }

  async findOne(id: number) {
    const reservation = await this.databaseService.reservation.findUnique({
      where: { reservation_id: id }
    })

    if (!reservation) {
      throw new NotFoundException(`Not found reservation with ID: ${id}`);
    }

    return reservation;
  }

  async findOneScheduledForVehicleByUserId(user_id: number, vehicle_id: number) {
    try {
      const vehicle = await this.vehicleService.findOne(vehicle_id);

      if (!vehicle) {
        throw new NotFoundException(`Vehicle with ID ${vehicle_id} not found`);
      }

      if (vehicle.user_id !== user_id) {
        throw new BadRequestException(`Vehicle with ID ${vehicle_id} does not belong to user with ID ${user_id}`);
      }

      return this.databaseService.reservation.findFirst({
        where: {
          user_id: user_id,
          vehicle_id: vehicle_id,
          status: ReservationStatus.scheduled
        }
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Cannot create reservation please try later!');
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateReservationDto) {
    const reservation = this.findOne(id);

    const updatedReservation = this.databaseService.reservation.update({
      where: { reservation_id: id },
      data: {
        ...dto
      }
    })
  }

  async updateReservationStatus(
    id: number,
    user_id: number,
    vehicle_id: number,
    status: ReservationStatus,
    tx?: any
  ) {
    const prisma = tx || this.databaseService;

    const reservationUpdate = await prisma.reservation.findUnique({
      where: { reservation_id: id, vehicle_id: vehicle_id },
      include: {
        station: true,
        vehicle: true,
        user: true
      }
    })

    if (!reservationUpdate || reservationUpdate.user_id != user_id) {
      throw new NotFoundException(`Reservation not found or made by user with ID ${user_id}`);
    }

    // Store previous status for WebSocket event
    const previousStatus = reservationUpdate.status;

    if (status === ReservationStatus.cancelled) {
      // If cancelling a reservation, update the battery status to 'full'
      await this.batteriesService.updateBatteryStatus(reservationUpdate.battery_id, BatteryStatus.full);
    }

    const updatedReservation = await prisma.reservation.update({
      where: { reservation_id: id },
      data: { status },
      include: {
        battery: {
          select: {
            battery_id: true,
            status: true,
          }
        }
      },
    });

    // Emit WebSocket event if status actually changed
    if (previousStatus !== status) {
      const payload: ReservationStatusUpdatedEvent = {
        reservationId: reservationUpdate.reservation_id,
        stationId: reservationUpdate.station.station_id,
        stationName: reservationUpdate.station.name,
        previousStatus,
        currentStatus: status,
        scheduledTime: reservationUpdate.scheduled_time.toISOString(),
        vehicle: {
          id: reservationUpdate.vehicle.vehicle_id,
          vin: reservationUpdate.vehicle.vin
        },
        user: {
          id: reservationUpdate.user.user_id,
          username: reservationUpdate.user.username,
          email: reservationUpdate.user.email
        },
        timestamp: new Date().toISOString()
      };

      this.reservationsGateway.notifyReservationStatusUpdated(payload);
      this.logger.log(
        `Reservation ${id} status updated: ${previousStatus} → ${status}. WebSocket event emitted.`
      );
    }

    return updatedReservation;
  }

  remove(id: number) {
    return `This action removes a #${id} reservation`;
  }

  //@Cron(CronExpression.EVERY_3_MINUTE)
  @Interval(60000) // chạy mỗi phút 
  async cancelExpiredReservations() {
    const now = new Date();

    // Tìm tất cả reservation scheduled nhưng đã qua thời gian
    const expiredReservations = await this.databaseService.reservation.findMany({
      where: {
        status: 'scheduled',
        scheduled_time: {
          lt: now,
        },
      },
    });

    if (expiredReservations.length > 0) {
      const expiredReservationIds = expiredReservations.map(r => r.reservation_id);

      await this.databaseService.reservation.updateMany({
        where: { reservation_id: { in: expiredReservationIds } },
        data: { status: ReservationStatus.cancelled },
      });
    }
  }
}
