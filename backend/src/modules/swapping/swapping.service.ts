import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SwappingDto } from './dto/swapping.dto';
import { UsersService } from '../users/users.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { BatteriesService } from '../batteries/batteries.service';
import { StationsService } from '../stations/stations.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { DatabaseService } from '../database/database.service';
import { SwapTransactionsService } from '../swap-transactions/swap-transactions.service';
import { SwapTransactionsGateway } from '../swap-transactions/swap-transactions.gateway';
import { BatteryStatus, ReservationStatus, SubscriptionStatus, SwapTransactionStatus } from '@prisma/client';
import { FirstSwapDto } from './dto/first-swap.dto';
import { ReservationsService } from '../reservations/reservations.service';
@Injectable()
export class SwappingService {
    private readonly logger = new Logger(SwappingService.name);
    constructor(
        private databaseService: DatabaseService,
        private usersService: UsersService,
        private vehiclesService: VehiclesService,
        private batteriesService: BatteriesService,
        private stationsService: StationsService,
        private swapTransactionsService: SwapTransactionsService,
        private swapTransactionsGateway: SwapTransactionsGateway,
        private subscriptionsService: SubscriptionsService,
        private reservationsService: ReservationsService,
    ) { }

    async swapBatteries(swapDto: SwappingDto) {
        const { user_id, vehicle_id, station_id } = swapDto;
        const KM_PER_PERCENT: number = 5;
        const FULL_BATTERY_PERCENT: number = 100;

        try {
            // ✅ Move ALL validation OUTSIDE transaction to reduce transaction time
            // Check user is exist
            const user = await this.usersService.findOneById(user_id);

            // Check station is exist
            const station = await this.stationsService.findOne(station_id);

            // Check vehicle is exist
            const vehicle = await this.vehiclesService.findOne(vehicle_id);

            // Check vehicle status is active
            if (vehicle.status !== 'active') {
                throw new BadRequestException(
                    `Vehicle is not active (current status: ${vehicle.status}). ` +
                    `Please ensure the vehicle has an active subscription.`
                );
            }

            // Check user subscription is valid
            const subscription = await this.subscriptionsService.findOneByVehicleId(vehicle_id);
            if (subscription.status === SubscriptionStatus.pending_penalty_payment) {
                throw new BadRequestException('Your subscription is pending penalty payment. Please settle the penalties to proceed with battery swapping.');
            }

            if (subscription.status !== SubscriptionStatus.active) {
                throw new BadRequestException('No active subscription found for this vehicle. Please subscribe to a plan to swap batteries.');
            }

            // Check reservation
            const reservation = await this.reservationsService.findOneScheduledForVehicleByUserId(user_id, vehicle_id);
            let taken_battery_id: number;

            if (reservation) {
                this.logger.log(`User has a reservation: ${JSON.stringify(reservation)}`);

                if (reservation.station_id !== station_id) {
                    throw new BadRequestException(`Reservation station does not match the swapping station`);
                }

                if (reservation.vehicle_id !== vehicle_id) {
                    throw new BadRequestException(`Reservation vehicle does not match the swapping vehicle`);
                }

                taken_battery_id = reservation.battery_id;
                // Update battery status to full for swapping
                await this.batteriesService.update(taken_battery_id, { status: BatteryStatus.full });
            } else {
                taken_battery_id = (await this.batteriesService.findBestBatteryForVehicle(vehicle_id, station_id)).battery_id;
            }

            const return_battery_id = vehicle.battery_id;
            // Handle first swap case
            if (!return_battery_id) {
                const firstSwapDto: FirstSwapDto = {
                    user_id,
                    station_id,
                    vehicle_id,
                    taken_battery_id,
                    subscription_id: subscription.subscription_id,
                    reservation_id: reservation?.reservation_id
                };
                return await this.initializeBattery(firstSwapDto);
            }

            // ✅ Fetch return battery details BEFORE transaction
            const returnBattery = await this.batteriesService.findOne(return_battery_id);
            const batteryUsedPercent = FULL_BATTERY_PERCENT - returnBattery.current_charge.toNumber();
            const distanceTraveled = batteryUsedPercent * KM_PER_PERCENT;
            this.logger.log(`Battery used percent: ${batteryUsedPercent}%, Distance traveled: ${distanceTraveled} km`);

            // ✅ NOW start transaction with all data ready - should complete much faster
            return await this.databaseService.$transaction(async (prisma) => {
                // All these operations happen quickly in sequence
                await this.batteriesService.returnBatteryToStation(return_battery_id, station_id, prisma);
                await this.batteriesService.assignBatteryToVehicle(taken_battery_id, vehicle_id, prisma);
                await this.subscriptionsService.incrementSwapUsed(subscription.subscription_id, prisma);
                await this.subscriptionsService.updateDistanceTraveled(
                    subscription.subscription_id,
                    distanceTraveled,
                    prisma
                );

                const swapRecord = await this.swapTransactionsService.create({
                    user_id,
                    vehicle_id,
                    station_id,
                    battery_taken_id: taken_battery_id,
                    battery_returned_id: return_battery_id,
                    subscription_id: subscription.subscription_id,
                    status: SwapTransactionStatus.completed,
                }, prisma);

                let reservationStatus = null;
                if (reservation) {
                    reservationStatus = await this.reservationsService.updateReservationStatus(
                        reservation.reservation_id,
                        user_id,
                        vehicle_id,
                        ReservationStatus.completed,
                        prisma
                    );
                }

                this.logger.log(`Battery swap completed successfully for user ID ${user_id}, vehicle ID ${vehicle_id}`);
                
                // 🔥 Emit WebSocket event for swap transaction created
                this.swapTransactionsGateway.notifySwapCreated({
                    transactionId: swapRecord.transaction_id,
                    stationId: station_id,
                    stationName: station.name,
                    user: {
                        userId: user_id,
                        username: user.username,
                        email: user.email,
                    },
                    vehicle: {
                        vehicleId: vehicle_id,
                        vin: vehicle.vin,
                        batteryModel: vehicle.battery_model || 'Unknown',
                    },
                    batteryTaken: {
                        batteryId: taken_battery_id,
                        charge: 100, // Battery taken is always full
                    },
                    batteryReturned: {
                        batteryId: return_battery_id,
                        charge: Number(returnBattery.current_charge),
                    },
                    status: SwapTransactionStatus.completed,
                    timestamp: new Date().toISOString(),
                    distanceTraveled: distanceTraveled,
                    batteryUsedPercent: batteryUsedPercent,
                });

                return {
                    message: 'Battery swap successful',
                    swap_used: subscription.swap_used + 1, // ✅ Return incremented value
                    batteryUsedPercent: batteryUsedPercent,
                    distance_used: distanceTraveled,
                    distance_traveled: subscription.distance_traveled + distanceTraveled,
                    swapTransaction: swapRecord,
                    reservation_status: reservation ? ReservationStatus.completed : null
                }
            }, {
                timeout: 10000, // ✅ Increase timeout to 10 seconds as safety net
            });
        } catch (error) {
            throw error;
        }
    }

    async initializeBattery(firstSwapDto: FirstSwapDto) {
        const { user_id, station_id, vehicle_id, taken_battery_id, reservation_id, subscription_id } = firstSwapDto;
        try {
            // Fetch data before transaction for WebSocket event
            const user = await this.usersService.findOneById(user_id);
            const station = await this.stationsService.findOne(station_id);
            const vehicle = await this.vehiclesService.findOne(vehicle_id);
            const takenBattery = await this.batteriesService.findOne(taken_battery_id);

            return await this.databaseService.$transaction(async (prisma) => {

                // ✅ FIXED: assignBatteryToVehicle now updates both Battery AND Vehicle
                // No need to call updateBatteryId separately
                await this.batteriesService.assignBatteryToVehicle(taken_battery_id, vehicle_id, prisma);

                //Create swap transaction 
                const swapRecord = await this.swapTransactionsService.create({
                    user_id,
                    vehicle_id,
                    station_id,
                    battery_taken_id: taken_battery_id,
                    subscription_id: subscription_id,
                    status: SwapTransactionStatus.completed,
                }, prisma);

                if (reservation_id) {
                    await this.reservationsService.updateReservationStatus(reservation_id, user_id, vehicle_id, ReservationStatus.completed, prisma);
                }

                this.logger.log(`Battery initialization completed for user ID ${user_id}, vehicle ID ${vehicle_id}`);

                // 🔥 Emit WebSocket event for first swap (initialization)
                this.swapTransactionsGateway.notifySwapCreated({
                    transactionId: swapRecord.transaction_id,
                    stationId: station_id,
                    stationName: station.name,
                    user: {
                        userId: user_id,
                        username: user.username,
                        email: user.email,
                    },
                    vehicle: {
                        vehicleId: vehicle_id,
                        vin: vehicle.vin,
                        batteryModel: vehicle.battery_model || 'Unknown',
                    },
                    batteryTaken: {
                        batteryId: taken_battery_id,
                        charge: Number(takenBattery.current_charge),
                    },
                    status: SwapTransactionStatus.completed,
                    timestamp: new Date().toISOString(),
                });

                return {
                    message: 'Battery initialization successful',
                    swapTransaction: swapRecord,
                    reservation_status: reservation_id ? ReservationStatus.completed : null
                }
            });
        } catch (error) {
            throw error;
        }
    }
}
