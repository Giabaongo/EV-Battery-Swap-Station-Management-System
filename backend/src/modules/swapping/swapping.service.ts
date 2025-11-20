import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SwappingDto } from './dto/swapping.dto';
import { UsersService } from '../users/users.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { BatteriesService } from '../batteries/batteries.service';
import { StationsService } from '../stations/stations.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { DatabaseService } from '../database/database.service';
import { SwapTransactionsService } from '../swap-transactions/swap-transactions.service';
import { BatteryStatus, CabinetStatus, ReservationStatus, SubscriptionStatus, SwapTransactionStatus } from '@prisma/client';
import { FirstSwapDto } from './dto/first-swap.dto';
import { ReservationsService } from '../reservations/reservations.service';
import { CabinetsService } from '../cabinets/cabinets.service';

import { ReturnBatteryDto } from './dto/return-battery.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { FindEmptySlotDto } from './dto/find-empty-slot.dto';
import { FindBatteryFullSlotDto } from './dto/find-battery-full-slot';
import { TakeBatteryDto } from './dto/take-battery.dto';
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
        private subscriptionsService: SubscriptionsService,
        private reservationsService: ReservationsService,
        private cabinetsService: CabinetsService,
    ) { }

    /**
     * Validates common swap preconditions
     * @returns { user, station, vehicle, subscription }
     */
    private async validateSwapPreconditions(
        user_id: number,
        station_id: number,
        vehicle_id: number
    ) {
        const [user, station, vehicle, subscription] = await Promise.all([
            this.usersService.findOneById(user_id),
            this.stationsService.findOne(station_id),
            this.vehiclesService.findOne(vehicle_id),
            this.subscriptionsService.findOneByVehicleId(vehicle_id)
        ]);

        // Validate vehicle ownership
        if (vehicle.user_id !== user_id) {
            throw new BadRequestException('Vehicle does not belong to the user.');
        }

        // Validate subscription ownership
        if (subscription.user_id !== user_id) {
            throw new BadRequestException('Subscription does not belong to the user.');
        }

        if (subscription.status === SubscriptionStatus.pending_penalty_payment) {
            throw new BadRequestException(
                'Your subscription is pending penalty payment. Please settle the penalties to proceed.'
            );
        }

        return { user, station, vehicle, subscription };
    }

    /**
     * Finds first available empty slot across all active cabinets at station
     */
    private async findFirstEmptySlot(station_id: number) {
        const cabinets = await this.cabinetsService.findManyByStation(
            station_id,
            CabinetStatus.active
        );

        if (!cabinets?.length) {
            throw new BadRequestException('No active cabinets available at this station.');
        }

        for (const cabinet of cabinets) {
            const emptySlot = await this.cabinetsService.findEmptySlotAtCabinet(cabinet.cabinet_id);
            if (emptySlot) {
                return { cabinet, slot: emptySlot };
            }
        }

        throw new BadRequestException('No empty slots available in the cabinets at this station.');
    }

    async getEmptySlotForReturnBattery(dto: FindEmptySlotDto) {
        const { user, vehicle, subscription } = await this.validateSwapPreconditions(
            dto.user_id,
            dto.station_id,
            dto.vehicle_id
        );

        if (!vehicle.battery_id) {
            //TODO: Differentiate first-time initialization case
            throw new BadRequestException(
                'Vehicle has no battery to return. Please perform the first battery initialization instead.'
            );
        }

        return this.findFirstEmptySlot(dto.station_id);
    }

    async returnBatteryToCabinet(dto: ReturnBatteryDto) {
        const { vehicle, subscription } = await this.validateSwapPreconditions(
            dto.user_id,
            dto.station_id,
            dto.vehicle_id
        );

        if (!vehicle.battery_id) {
            throw new BadRequestException(
                'Vehicle has no battery to return. Please perform the first battery initialization instead.'
            );
        }

        const returnBattery = await this.batteriesService.findOne(vehicle.battery_id);

        if (returnBattery.soh.lessThan(new Decimal(80))) {
            throw new BadRequestException('Battery SOH is below 80%. Cannot return to cabinet.');
        }

        this.logger.log(
            `Returning battery ${returnBattery.battery_id} to cabinet ${dto.cabinet_id}, slot ${dto.slot_id}`
        );

        // Perform all updates within a transaction
        return await this.databaseService.$transaction(async (prisma) => {
            const batteryReturnUpdate = {
                station_id: dto.station_id,
                cabinet_id: dto.cabinet_id,
                slot_id: dto.slot_id,
                vehicle_id: null
            };


            // Execute updates in parallel within transaction
            const [updatedBattery, updatedVehicle, swapRecord] = await Promise.all([
                this.batteriesService.update(returnBattery.battery_id, batteryReturnUpdate, prisma),
                this.vehiclesService.update(dto.vehicle_id, { battery_id: null }, prisma),
                this.swapTransactionsService.create(
                    {
                        user_id: dto.user_id,
                        vehicle_id: dto.vehicle_id,
                        station_id: dto.station_id,
                        cabinet_id: dto.cabinet_id,
                        battery_returned_id: returnBattery.battery_id,
                        subscription_id: subscription.subscription_id,
                        status: SwapTransactionStatus.pending
                    },
                    prisma
                )
            ]);

            this.logger.log(
                `Battery ${returnBattery.battery_id} returned successfully. Transaction ID: ${swapRecord.transaction_id}`
            );

            return {
                message: 'Battery returned to cabinet successfully',
                battery: updatedBattery,
                vehicle: updatedVehicle,
                swapTransaction: swapRecord
            };
        });
    }

    async getTakenBatterySlot(dto: FindBatteryFullSlotDto) {
        const [cabinet, vehicle, subscription] = await Promise.all([
            this.cabinetsService.findOneCabinet(dto.cabinet_id),
            this.vehiclesService.findOne(dto.vehicle_id),
            this.subscriptionsService.findOneByVehicleId(dto.vehicle_id)
        ]);

        // Batch ownership validations
        if (vehicle.user_id !== dto.user_id) {
            throw new BadRequestException('Vehicle does not belong to the user.');
        }

        if (subscription.user_id !== dto.user_id) {
            throw new BadRequestException('Subscription does not belong to the user.');
        }

        if (subscription.status === SubscriptionStatus.pending_penalty_payment) {
            throw new BadRequestException(
                'Your subscription is pending penalty payment. Please settle the penalties to proceed with battery swapping.'
            );
        }

        if (vehicle.battery_id) {
            throw new BadRequestException(
                'Vehicle already has a battery assigned. Cannot take another battery.'
            );
        }

        // Check for reservation first
        const reservation = await this.reservationsService.findOneScheduledForVehicleByUserId(
            dto.user_id,
            dto.vehicle_id
        );

        let takenBattery;

        if (reservation?.battery_id) {
            // Flow 1: Use reserved battery
            takenBattery = await this.batteriesService.findOne(reservation.battery_id);
            this.logger.log(`Using reserved battery ID ${takenBattery.battery_id}`);
        } else {
            // Flow 2: Find best available battery
            takenBattery = await this.batteriesService.findBestBatteryForVehicle(
                dto.vehicle_id,
                dto.station_id,
                dto.cabinet_id
            );
            this.logger.log(`Found best battery ID ${takenBattery.battery_id}`);
        }

        // Validate battery availability
        if (!takenBattery.slot_id) {
            throw new BadRequestException(
                `Battery ID ${takenBattery.battery_id} is not available in any slot (status: ${takenBattery.status})`
            );
        }

        if (takenBattery.cabinet_id !== dto.cabinet_id) {
            throw new BadRequestException(
                `Battery ID ${takenBattery.battery_id} is in cabinet ${takenBattery.cabinet_id}, not in requested cabinet ${dto.cabinet_id}`
            );
        }

        return { battery: takenBattery };
    }

    async takeBatteryFromCabinet(dto: TakeBatteryDto) {
        const { vehicle, subscription } = await this.validateSwapPreconditions(
            dto.user_id,
            dto.station_id,
            dto.vehicle_id
        );

        // Verify vehicle has no battery (already returned)
        if (vehicle.battery_id) {
            throw new BadRequestException(
                'Vehicle already has a battery assigned. Please return the current battery first.'
            );
        }

        // Fetch battery and transaction in parallel
        const [takenBattery, existingSwapTransaction, reservation] = await Promise.all([
            this.batteriesService.findOne(dto.taken_battery_id),
            this.swapTransactionsService.findPendingTransactionByVehicle(dto.vehicle_id),
            this.reservationsService.findOneScheduledForVehicleByUserId(dto.user_id, dto.vehicle_id)
        ]);

        // Validate battery status
        if (takenBattery.status !== BatteryStatus.full) {
            throw new BadRequestException(
                `Battery is not available for taking. Status: ${takenBattery.status}`
            );
        }

        if (
            takenBattery.station_id !== dto.station_id ||
            takenBattery.cabinet_id !== dto.cabinet_id
        ) {
            throw new BadRequestException('Battery is not in the specified station/cabinet.');
        }

        if (!existingSwapTransaction) {
            throw new BadRequestException(
                'No pending swap transaction found. Please return battery first.'
            );
        }

        this.logger.log(
            `Taking battery ${dto.taken_battery_id} from cabinet ${dto.cabinet_id} for vehicle ${dto.vehicle_id}`
        );

        // Perform all updates within a transaction
        return await this.databaseService.$transaction(async (prisma) => {
            const batteryTakeUpdate = {
                station_id: null,
                cabinet_id: null,
                slot_id: null,
                vehicle_id: dto.vehicle_id
            };

            const vehicleUpdate = { battery_id: dto.taken_battery_id };

            const swapTransactionUpdate = {
                battery_taken_id: dto.taken_battery_id,
                status: SwapTransactionStatus.completed
            };

            // Execute all updates in parallel within transaction
            const [updatedBattery, updatedVehicle, completedSwapTransaction, updatedSubscription] =
                await Promise.all([
                    this.batteriesService.update(dto.taken_battery_id, batteryTakeUpdate, prisma),
                    this.vehiclesService.update(dto.vehicle_id, vehicleUpdate, prisma),
                    this.swapTransactionsService.update(
                        existingSwapTransaction.transaction_id,
                        swapTransactionUpdate,
                        prisma
                    ),
                    this.subscriptionsService.incrementSwapUsed(subscription.subscription_id, prisma)
                ]);

            // Update reservation if applicable
            let reservationStatus: ReservationStatus | null = null;
            if (reservation?.battery_id === dto.taken_battery_id) {
                await this.reservationsService.updateReservationStatus(
                    reservation.reservation_id,
                    dto.user_id,
                    dto.vehicle_id,
                    ReservationStatus.completed,
                    prisma
                );
                reservationStatus = ReservationStatus.completed;
            }

            this.logger.log(
                `Battery swap completed successfully for user ID ${dto.user_id}, vehicle ID ${dto.vehicle_id}`
            );

            return {
                message: 'Battery taken from cabinet successfully. Swap completed.',
                battery: updatedBattery,
                vehicle: updatedVehicle,
                swapTransaction: completedSwapTransaction,
                swap_used: updatedSubscription.swap_used,
                reservation_status: reservationStatus
            };
        });
    }

    // async swapBatteries(swapDto: SwappingDto) {
    //     const { user_id, vehicle_id, station_id } = swapDto;
    //     const KM_PER_PERCENT: number = 5; // Example: 5 km per 1% battery
    //     const FULL_BATTERY_PERCENT: number = 100;

    //     try {
    //         // Check user is exist
    //         const user = await this.usersService.findOneById(user_id);

    //         // Check station is exist
    //         const station = await this.stationsService.findOne(station_id);

    //         // Check vehicle is exist
    //         const vehicle = await this.vehiclesService.findOne(vehicle_id);

    //         // Check user subscription is valid
    //         const subscription = await this.subscriptionsService.findOneByVehicleId(vehicle_id);
    //         if (subscription.status === SubscriptionStatus.pending_penalty_payment) {
    //             throw new BadRequestException('Your subscription is pending penalty payment. Please settle the penalties to proceed with battery swapping.');
    //         }

    //         // Check subscription is active
    //         if (subscription.status !== SubscriptionStatus.active) {
    //             throw new BadRequestException('No active subscription found for this vehicle. Please subscribe to a plan to swap batteries.');
    //         }

    //         //check is use have reservation at this station
    //         const reservation = await this.reservationsService.findOneScheduledForVehicleByUserId(user_id, vehicle_id);
    //         let taken_battery_id: number;
    //         if (reservation) {
    //             this.logger.log(`User has a reservation: ${JSON.stringify(reservation)}`);
    //             taken_battery_id = reservation.battery_id;

    //             if (reservation.station_id !== station_id) {
    //                 throw new BadRequestException(`Reservation station does not match the swapping station`);
    //             }

    //             if (reservation.vehicle_id === vehicle_id) {
    //                 taken_battery_id = reservation.battery_id;
    //                 // Update battery status to full for swapping
    //                 await this.batteriesService.updateBatteryStatus(taken_battery_id, BatteryStatus.full);
    //             }
    //         }
    //         else {
    //             taken_battery_id = (await this.batteriesService.findBestBatteryForVehicle(vehicle_id, station_id)).battery_id;
    //         }

    //         //get return battery id from vehicle
    //         const return_battery_id = vehicle.battery_id;

    //         // If no return battery, it means it's the first swap, so just assign the taken battery to the vehicle
    //         if (!return_battery_id) {
    //             const firstSwapDto: FirstSwapDto = {
    //                 user_id,
    //                 station_id,
    //                 vehicle_id,
    //                 taken_battery_id,
    //                 subscription_id: subscription.subscription_id,
    //                 reservation_id: reservation?.reservation_id
    //             };
    //             return await this.initializeBattery(firstSwapDto);
    //         }

    //         // Perform the swap within a transaction
    //         return await this.databaseService.$transaction(async (prisma) => {

    //             //Return battery to station
    //             const emptySlot = await this.cabinetsService.findEmptySlotAtCabinet(station_id);
    //             if (!emptySlot) {
    //                 throw new BadRequestException('No empty slots available in the cabinet at this station.');
    //             }

    //             const batteryReturnUpdate = {
    //                 station_id: station_id,
    //                 cabinet_id: emptySlot.cabinet_id,
    //                 slot_number: emptySlot.slot_number
    //             };

    //             await this.batteriesService.update(return_battery_id, batteryReturnUpdate, prisma);

    //             //Assign taken battery to vehicle
    //             const assignBatteryInfo = {
    //                 station_id: null,
    //                 cabinet_id: null,
    //                 slot_number: null,
    //                 vehicle_id: vehicle_id
    //             };

    //             await this.batteriesService.update(taken_battery_id, assignBatteryInfo, prisma);

    //             //Update vehicle battery_id
    //             const vehicleUpdate = {
    //                 battery_id: taken_battery_id
    //             };
    //             await this.vehiclesService.update(vehicle_id, vehicleUpdate, prisma);

    //             //Update subscription swap used and distance traveled
    //             await this.subscriptionsService.incrementSwapUsed(subscription.subscription_id, prisma);

    //             //Calculate battery used percent and distance traveled
    //             const returnBattery = await this.batteriesService.findOne(return_battery_id);
    //             const batteryUsedPercent = FULL_BATTERY_PERCENT - returnBattery.current_charge.toNumber();
    //             const distanceTraveled = batteryUsedPercent * KM_PER_PERCENT;
    //             this.logger.log(`Battery used percent: ${batteryUsedPercent}%, Distance traveled: ${distanceTraveled} km`);

    //             // Update distance traveled in subscription
    //             await this.subscriptionsService.updateDistanceTraveled(
    //                 subscription.subscription_id,
    //                 distanceTraveled,
    //                 prisma
    //             );

    //             //Create swap transaction 
    //             const swapRecord = await this.swapTransactionsService.create({
    //                 user_id,
    //                 vehicle_id,
    //                 station_id,
    //                 battery_taken_id: taken_battery_id,
    //                 battery_returned_id: return_battery_id,
    //                 subscription_id: subscription.subscription_id,
    //                 status: SwapTransactionStatus.completed,
    //             }, prisma);

    //             let reservationStatus = null;
    //             //If user have reservation, update reservation status to completed
    //             if (reservation) {
    //                 reservationStatus = await this.reservationsService.updateReservationStatus(reservation.reservation_id, user_id, ReservationStatus.completed, prisma);
    //             }

    //             this.logger.log(`Battery swap completed successfully for user ID ${user_id}, vehicle ID ${vehicle_id}`);
    //             return {
    //                 message: 'Battery swap successful',
    //                 swap_used: subscription.swap_used,
    //                 batteryUsedPercent: batteryUsedPercent,
    //                 distance_used: distanceTraveled,
    //                 distance_traveled: subscription.distance_traveled + distanceTraveled,
    //                 swapTransaction: swapRecord,
    //                 reservation_status: reservation ? ReservationStatus.completed : null
    //             }
    //         });
    //     } catch (error) {
    //         throw error;
    //     }
    // }

    // async initializeBattery(firstSwapDto: FirstSwapDto) {
    //     const { user_id, station_id, vehicle_id, taken_battery_id, reservation_id, subscription_id } = firstSwapDto;
    //     try {
    //         return await this.databaseService.$transaction(async (prisma) => {

    //             await this.batteriesService.assignBatteryToVehicle(taken_battery_id, vehicle_id, prisma);
    //             await this.vehiclesService.updateBatteryId(vehicle_id, taken_battery_id, prisma);

    //             //Create swap transaction 
    //             const swapRecord = await this.swapTransactionsService.create({
    //                 user_id,
    //                 vehicle_id,
    //                 station_id,
    //                 battery_taken_id: taken_battery_id,
    //                 subscription_id: subscription_id,
    //                 status: SwapTransactionStatus.completed,
    //             }, prisma);

    //             if (reservation_id) {
    //                 await this.reservationsService.updateReservationStatus(reservation_id, user_id, ReservationStatus.completed, prisma);
    //             }

    //             return {
    //                 message: 'Battery initialization successful',
    //                 swapTransaction: swapRecord,
    //                 reservation_status: reservation_id ? ReservationStatus.completed : null
    //             }
    //         });
    //     } catch (error) {
    //         throw error;
    //     }
    // }
}
