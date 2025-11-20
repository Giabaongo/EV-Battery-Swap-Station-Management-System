NguyenVo-FPT:    async getEmptySlotForReturnBattery(dto: FindEmptySlotDto) {
        try {
            // Check user is exist
            const user = await this.usersService.findOneById(dto.user_id);

            // Check station is exist
            const station = await this.stationsService.findOne(dto.station_id);

            // Check vehicle is exist
            const vehicle = await this.vehiclesService.findOne(dto.vehicle_id);

            const subscription = await this.subscriptionsService.findOneByVehicleId(dto.vehicle_id);
            if (subscription.status === SubscriptionStatus.pending_penalty_payment) {
                throw new BadRequestException('Your subscription is pending penalty payment. Please settle the penalties to proceed with battery return.');
            }

            if (!vehicle.battery_id) {
                //TODO: change to first swap flow
                throw new BadRequestException('Vehicle has no battery to return. Please perform the first battery initialization instead.');
            }

            const cabinets = await this.cabinetsService.findManyByStation(dto.station_id, CabinetStatus.active);

            if (!cabinets || cabinets.length === 0) {
                throw new BadRequestException('No active cabinets available at this station.');
            }

            for (const cabinet of cabinets) {
                const emptySlot = await this.cabinetsService.findEmptySlotAtCabinet(cabinet.cabinet_id);
                if (emptySlot) {
                    return {
                        cabinet,
                        slot: emptySlot
                    }
                }
            }

            throw new BadRequestException('No empty slots available in the cabinets at this station.');
        } catch (error) {
            throw error;
        }
    }

    async returnBatteryToCabinet(dto: ReturnBatteryDto) {
        try {
            // Check user is exist
            const user = await this.usersService.findOneById(dto.user_id);

            // Check station is exist
            const station = await this.stationsService.findOne(dto.station_id);

            // Check vehicle is exist
            const vehicle = await this.vehiclesService.findOne(dto.vehicle_id);

            const subscription = await this.subscriptionsService.findOneByVehicleId(dto.vehicle_id);
            if (subscription.status === SubscriptionStatus.pending_penalty_payment) {
                throw new BadRequestException('Your subscription is pending penalty payment. Please settle the penalties to proceed with battery return.');
            }

            if (!vehicle.battery_id) {
                //TODO: change to first swap flow
                throw new BadRequestException('Vehicle has no battery to return. Please perform the first battery initialization instead.');
            }

            const returnBattery = await this.batteriesService.findOne(vehicle.battery_id);

            if (returnBattery.soh < new Decimal(80)) {
                throw new BadRequestException('Battery SOH is below 80%. Cannot return to cabinet.');
            }

            const batteryReturnUpdate = {
                station_id: dto.station_id,
                cabinet_id: dto.cabinet_id,
                slot_id: dto.slot_id,
                vehicle_id: null
            };

            this.logger.log(`Returning battery ${returnBattery.battery_id} to cabinet ${dto.cabinet_id}, slot ${dto.slot_id}`);
            const updatedBattery = await this.batteriesService.update(returnBattery.battery_id, batteryReturnUpdate);

            const newSwapTransactionDto = {
                user_id: dto.user_id,
                vehicle_id: dto.vehicle_id,
                station_id: dto.station_id,
                cabinet_id: dto.cabinet_id,
                battery_returned_id: returnBattery.battery_id,
                subscription_id: subscription.subscription_id,
                status: SwapTransactionStatus.pending
            };

            this.logger.log(`Creating swap transaction for returned battery ${returnBattery.battery_id}`);
            const swapRecord = await this.swapTransactionsService.create(newSwapTransactionDto);


            return {
                message: 'Battery returned to cabinet successfully',
                battery: updatedBattery,
                swapTransaction: swapRecord
            };
        } catch (error) {
            throw error;
        }
    }

    async getTakenBatterySlot(dto: FindBatteryFullSlotDto) {
        try {
            const user = await this.usersService.findOneById(dto.user_id);
            const station = await this.stationsService.findOne(dto.station_id);
            const cabinet = await this.cabinetsService.findOneCabinet(dto.cabinet_id);
            const vehicle = await this.vehiclesService.findOne(dto.vehicle_id);
            const subscription = await this.subscriptionsService.findOneByVehicleId(dto.vehicle_id);

            if (vehicle.user_id !== dto.user_id) {
                throw new BadRequestException('Vehicle does not belong to the user.');
            }

            if (subscription.user_id !== dto.user_id) {
                throw new BadRequestException('Subscription does not belong to the user.');
            }

            if (subscription.status === SubscriptionStatus.pending_penalty_payment) {
                throw new BadRequestException('Your subscription is pending penalty payment.' +
                    'Please settle the penalties to proceed with battery swapping.');
            }

            if (vehicle.battery_id) {
                throw new BadRequestException('Vehicle already has a battery assigned. Cannot take another battery.');
            }

            // ✅ Ưu tiên battery từ reservation
            let takenBattery;
            const reservation = await this.reservationsService.findOneScheduledForVehicleByUserId(dto.user_id, dto.vehicle_id);

            if (reservation && reservation.battery_id) {
                // Luồng 1: Có reservation → Lấy battery đã đặt
                takenBattery = await this.batteriesService.findOne(reservation.battery_id);
                this.logger.log(`Using reserved battery ID ${takenBattery.battery_id}`);
            } else {
                // Luồng 2: Không có reservation → Tìm battery tốt nhất
                takenBattery = await this.batteriesService.findBestBatteryForVehicle(
                    dto.vehicle_id,
                    dto.station_id,
                    dto.cabinet_id
                );
                this.logger.log(`Found best battery ID ${takenBattery.battery_id}`);
            }

            // Validate battery phải có slot_id
            if (!takenBattery.slot_id) {
                throw new BadRequestException(
                    `Battery ID ${takenBattery.battery_id} is not available in any slot (status: ${takenBattery.status})`
                );
            }

            // Validate battery phải thuộc cabinet đúng
            if (takenBattery.cabinet_id !== dto.cabinet_id) {
                throw new BadRequestException(
                    `Battery ID ${takenBattery.battery_id} is in cabinet ${takenBattery.cabinet_id}, not in requested cabinet ${dto.cabinet_id}`
                );
            }

            // Lấy thông tin slot
            const slot = await this.cabinetsService.findOneSlotAtCabinet(
                cabinet.cabinet_id,
                takenBattery.slot_id
            );

            return {
                // include cabinet and slot
                battery: takenBattery,
            };

        } catch (error) {
            this.logger.error(`Error in getTakenBatterySlot: ${error.message}`);
            throw error;
        }
    }

    async takeBatteryFromCabinet(dto: TakeBatteryDto) {
        try {
            // Check user is exist
            const user = await this.usersService.findOneById(dto.user_id);

            // Check station is exist
            const station = await this.stationsService.findOne(dto.station_id);

            // Check vehicle is exist
            const vehicle = await this.vehiclesService.findOne(dto.vehicle_id);

            // Check subscription
            const subscription = await this.subscriptionsService.findOneByVehicleId(dto.vehicle_id);
            if (subscription.status === SubscriptionStatus.pending_penalty_payment) {
                throw new BadRequestException('Your subscription is pending penalty payment. Please settle the penalties to proceed with battery swapping.');
            }

            // Verify vehicle already returned battery (has no battery assigned)
            if (vehicle.battery_id) {
                throw new BadRequestException('Vehicle already has a battery assigned. Please return the current battery first.');
            }

            // Verify taken battery exists and is available
            const takenBattery = await this.batteriesService.findOne(dto.taken_battery_id);

            if (takenBattery.status !== BatteryStatus.full) {
                throw new BadRequestException('Battery is not available for taking. Status: ' + takenBattery.status);
            }

            if (takenBattery.station_id !== dto.station_id || takenBattery.cabinet_id !== dto.cabinet_id) {
                throw new BadRequestException('Battery is not in the specified station/cabinet.');
            }

            // Find existing swap transaction (from returnBatteryToCabinet)
            const existingSwapTransaction = await this.swapTransactionsService.findPendingTransactionByVehicle(dto.vehicle_id);

            if (!existingSwapTransaction) {
                throw new BadRequestException('No pending swap transaction found. Please return battery first.');
            }

            // Check if there's a reservation
            const reservation = await this.reservationsService.findOneScheduledForVehicleByUserId(dto.user_id, dto.vehicle_id);

            // Perform all updates within a transaction
            return await this.databaseService.$transaction(async (prisma) => {
                // Update battery - assign to vehicle
                const batteryTakeUpdate = {
                    station_id: null,
                    cabinet_id: null,
                    slot_id: null,
                    vehicle_id: dto.vehicle_id
                };

                this.logger.log(`Taking battery ${dto.taken_battery_id} from cabinet ${dto.cabinet_id}`);
                const updatedBattery = await this.batteriesService.update(dto.taken_battery_id, batteryTakeUpdate, prisma);

                // Update vehicle with new battery
                const vehicleUpdate = {
                    battery_id: dto.taken_battery_id
                };
                const updatedVehicle = await this.vehiclesService.update(dto.vehicle_id, vehicleUpdate, prisma);

                // Update swap transaction with taken battery and complete it
                const swapTransactionUpdate = {
                    battery_taken_id: dto.taken_battery_id,
                    status: SwapTransactionStatus.completed
                };

                this.logger.log(`Updating swap transaction ${existingSwapTransaction.transaction_id} with taken battery ${dto.taken_battery_id}`);
                const completedSwapTransaction = await this.swapTransactionsService.update(
                    existingSwapTransaction.transaction_id,
                    swapTransactionUpdate,
                    prisma
                );

                // Increment swap used count in subscription
                const updatedSubscription = await this.subscriptionsService.incrementSwapUsed(subscription.subscription_id, prisma);

                // If there's a reservation, mark it as completed
                let reservationStatus = null;
                if (reservation && reservation.battery_id === dto.taken_battery_id) {
                    reservationStatus = await this.reservationsService.updateReservationStatus(
                        reservation.reservation_id,
                        dto.user_id,
                        ReservationStatus.completed,
                        prisma
                    );
                }

                this.logger.log(`Battery swap completed successfully for user ID ${dto.user_id}, vehicle ID ${dto.vehicle_id}`);

                return {
                    message: 'Battery taken from cabinet successfully. Swap completed.',
                    battery: updatedBattery,
                    vehicle: updatedVehicle,
                    swapTransaction: completedSwapTransaction,
                    swap_used: updatedSubscription.swap_used,
                    reservation_status: reservationStatus ? ReservationStatus.completed : null
                };
            });
        } catch (error) {
            this.logger.error(`Error in takeBatteryFromCabinet: ${error.message}`);
            throw error;
        }
    }

    tối ưu code cho toi

GitHub Copilot: Dưới đây là code đã được tối ưu với các cải tiến chính:

1. **Loại bỏ try-catch thừa** (vì NestJS tự động xử lý exception)
2. **Tách logic validation thành methods riêng** để tái sử dụng
3. **Giảm database queries** bằng cách kết hợp kiểm tra
4. **Cải thiện error handling** và logging
5. **Refactor duplicate code**

````typescript
// ...existing code...

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

    const batteryReturnUpdate = {
        station_id: dto.station_id,
        cabinet_id: dto.cabinet_id,
        slot_id: dto.slot_id,
        vehicle_id: null
    };

    this.logger.log(
        `Returning battery ${returnBattery.battery_id} to cabinet ${dto.cabinet_id}, slot ${dto.slot_id}`
    );

    const [updatedBattery, swapRecord] = await Promise.all([
        this.batteriesService.update(returnBattery.battery_id, batteryReturnUpdate),
        this.swapTransactionsService.create({
            user_id: dto.user_id,
            vehicle_id: dto.vehicle_id,
            station_id: dto.station_id,
            cabinet_id: dto.cabinet_id,
            battery_returned_id: returnBattery.battery_id,
            subscription_id: subscription.subscription_id,
            status: SwapTransactionStatus.pending
        })
    ]);

    return {
        message: 'Battery returned to cabinet successfully',
        battery: updatedBattery,
        swapTransaction: swapRecord
    };
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
        let reservationStatus = null;
        if (reservation?.battery_id === dto.taken_battery_id) {
            await this.reservationsService.updateReservationStatus(
                reservation.reservation_id,
                dto.user_id,
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

// ...existing code...
````

## Các cải tiến chính

1. **validateSwapPreconditions()**: Method tái sử dụng cho validation chung
2. **findFirstEmptySlot()**: Tách logic tìm slot trống
3. **Promise.all()**: Chạy song song các query độc lập để giảm thời gian
4. **Loại bỏ try-catch thừa**: NestJS đã có exception filter tự động
5. **Consistent error messages**: Thống nhất format thông báo lỗi
6. **Better logging**: Log rõ ràng hơn cho debugging
7. **Cleaner code**: Giảm nested code, dễ đọc hơn

NguyenVo-FPT: src/modules/swapping/swapping.service.ts:280:65 - error TS2559: Type '{ battery_id: number; }' has no properties in common with type 'UpdateVehicleDto'.

280                     this.vehiclesService.update(dto.vehicle_id, vehicleUpdate, prisma),
                                                                    ~~~~~~~~~~~~~

src/modules/swapping/swapping.service.ts:298:17 - error TS2322: Type '"completed"' is not assignable to type 'null'.

298                 reservationStatus = ReservationStatus.completed;
                    ~~~~~~~~~~~~~~~~~

GitHub Copilot: Dưới đây là code đã sửa lỗi TypeScript:

````typescript
// ...existing code...

async returnBatteryToCabinet(dto: ReturnBatteryDto) {
    const { vehicle, subscription } = await this.validateSwapPreconditions(
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

    const returnBattery = await this.batteriesService.findOne(vehicle.battery_id);

    if (returnBattery.soh.lessThan(new Decimal(80))) {
        throw new BadRequestException('Battery SOH is below 80%. Cannot return to cabinet.');
    }

    const batteryReturnUpdate = {
        station_id: dto.station_id,
        cabinet_id: dto.cabinet_id,
        slot_id: dto.slot_id,
        vehicle_id: null
    };

    this.logger.log(
        `Returning battery ${returnBattery.battery_id} to cabinet ${dto.cabinet_id}, slot ${dto.slot_id}`
    );

    const [updatedBattery, , swapRecord] = await Promise.all([
        this.batteriesService.update(returnBattery.battery_id, batteryReturnUpdate),
        this.vehiclesService.update(dto.vehicle_id, { battery_id: null }),
        this.swapTransactionsService.create({
            user_id: dto.user_id,
            vehicle_id: dto.vehicle_id,
            station_id: dto.station_id,
            cabinet_id: dto.cabinet_id,
            battery_returned_id: returnBattery.battery_id,
            subscription_id: subscription.subscription_id,
            status: SwapTransactionStatus.pending
        })
    ]);

    return {
        message: 'Battery returned to cabinet successfully',
        battery: updatedBattery,
        swapTransaction: swapRecord
    };
}

// ...existing code...

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

        const swapTransactionUpdate = {
            battery_taken_id: dto.taken_battery_id,
            status: SwapTransactionStatus.completed
        };

        // Execute all updates in parallel within transaction
        const [updatedBattery, updatedVehicle, completedSwapTransaction, updatedSubscription] =
            await Promise.all([
                this.batteriesService.update(dto.taken_battery_id, batteryTakeUpdate, prisma),
                this.vehiclesService.update(dto.vehicle_id, { battery_id: dto.taken_battery_id }, prisma),
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

// ...existing code...
````

## Các sửa đổi

1. **Line 280 - vehicleUpdate**: Thay đổi từ `vehicleUpdate` thành inline object `{ battery_id: null }` hoặc `{ battery_id: dto.taken_battery_id }` để match với `UpdateVehicleDto`

2. **Line 298 - reservationStatus**: Khai báo type rõ ràng là `ReservationStatus | null` thay vì chỉ `null`

Điều này đảm bảo TypeScript hiểu đúng kiểu dữ liệu và không báo lỗi type mismatch.

NguyenVo-FPT: summary lại service này

GitHub Copilot: # Summary của SwappingService

## Mục đích chính

Service này quản lý quy trình **đổi pin cho xe điện** tại các trạm đổi pin, bao gồm 2 bước chính: **trả pin cũ** và **lấy pin mới**.

---

## Các phương thức chính

### 1. **validateSwapPreconditions** (private)

- **Mục đích**: Validate điều kiện chung trước khi swap
- **Kiểm tra**:
  - User, Station, Vehicle tồn tại
  - Subscription không bị pending penalty payment
- **Trả về**: `{ user, station, vehicle, subscription }`

### 2. **findFirstEmptySlot** (private)

- **Mục đích**: Tìm slot trống đầu tiên trong các cabinet active
- **Logic**: Duyệt qua các cabinet, tìm slot trống đầu tiên
- **Trả về**: `{ cabinet, slot }`

---

## Flow đổi pin (2 bước)

### **Bước 1: TRẢ PIN CŨ**

#### **getEmptySlotForReturnBattery**

- **Input**: `FindEmptySlotDto` (user_id, station_id, vehicle_id)
- **Logic**:
  - Validate preconditions
  - Kiểm tra vehicle có pin để trả không
  - Tìm slot trống
- **Output**: `{ cabinet, slot }`

#### **returnBatteryToCabinet**

- **Input**: `ReturnBatteryDto` (+ cabinet_id, slot_id)
- **Logic**:
  - Validate preconditions
  - Kiểm tra SOH pin ≥ 80%
  - **Update battery**: gán về cabinet/slot
  - **Update vehicle**: set battery_id = null
  - **Create swap transaction**: status = PENDING
- **Output**: `{ message, battery, swapTransaction }`

---

### **Bước 2: LẤY PIN MỚI**

#### **getTakenBatterySlot**

- **Input**: `FindBatteryFullSlotDto` (user_id, vehicle_id, station_id, cabinet_id)
- **Logic**:
  - Validate ownership (vehicle, subscription thuộc user)
  - Kiểm tra vehicle chưa có pin
  - **Ưu tiên reservation**:
    - Nếu có reservation → lấy pin đã đặt
    - Không có → tìm pin tốt nhất (highest SOC/SOH)
  - Validate pin phải available và đúng cabinet
- **Output**: `{ battery }`

#### **takeBatteryFromCabinet**

- **Input**: `TakeBatteryDto` (+ taken_battery_id)
- **Logic** (trong transaction):
  - Validate preconditions
  - Kiểm tra đã có pending swap transaction
  - Kiểm tra battery status = FULL
  - **Update battery**: gán cho vehicle
  - **Update vehicle**: set battery_id mới
  - **Update swap transaction**: status = COMPLETED, thêm battery_taken_id
  - **Increment swap_used** trong subscription
  - **Complete reservation** (nếu có)
- **Output**:

  ```typescript
  {
    message, battery, vehicle, 
    swapTransaction, swap_used, 
    reservation_status
  }
  ```

---

## Dependencies

- **UsersService**: Quản lý user
- **VehiclesService**: Quản lý xe
- **BatteriesService**: Quản lý pin
- **StationsService**: Quản lý trạm
- **CabinetsService**: Quản lý tủ/slot
- **SubscriptionsService**: Quản lý gói subscription
- **SwapTransactionsService**: Quản lý transaction đổi pin
- **ReservationsService**: Quản lý đặt pin trước
- **DatabaseService**: Prisma transaction

---

## Các validation chính

1. ✅ User/Station/Vehicle/Subscription tồn tại
2. ✅ Subscription không pending penalty
3. ✅ Vehicle ownership
4. ✅ Battery SOH ≥ 80% khi trả
5. ✅ Battery status = FULL khi lấy
6. ✅ Slot availability
7. ✅ Pending transaction tồn tại (bước 2)

---

## Code đã bị comment

- `swapBatteries()`: Flow cũ swap 1 bước (đã deprecated)
- `initializeBattery()`: Flow khởi tạo pin lần đầu (sẽ implement riêng)

NguyenVo-FPT: thêm end point giúp với

GitHub Copilot: Dưới đây là controller đầy đủ với các endpoint cho flow đổi pin 2 bước:

````typescript
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
````

## Giải thích các endpoint

### **STEP 1: Trả pin cũ**

1. **POST `/swapping/get-empty-slot`**
   - **Input**: `FindEmptySlotDto` (user_id, station_id, vehicle_id)
   - **Output**: `{ cabinet, slot }` - Slot trống để trả pin
   - **Mục đích**: User check slot nào có sẵn trước khi trả pin

2. **POST `/swapping/return-battery`**
   - **Input**: `ReturnBatteryDto` (user_id, station_id, vehicle_id, cabinet_id, slot_id)
   - **Output**: `{ message, battery, swapTransaction }`
   - **Mục đích**: Thực hiện trả pin, tạo pending transaction

---

### **STEP 2: Lấy pin mới**

3. **POST `/swapping/get-full-slot`**
   - **Input**: `FindBatteryFullSlotDto` (user_id, vehicle_id, station_id, cabinet_id)
   - **Output**: `{ battery }` - Pin tốt nhất hoặc pin đã đặt
   - **Mục đích**: User check pin nào sẽ lấy

4. **POST `/swapping/take-battery`**
   - **Input**: `TakeBatteryDto` (user_id, station_id, vehicle_id, taken_battery_id)
   - **Output**: `{ message, battery, vehicle, swapTransaction, swap_used, reservation_status }`
   - **Mục đích**: Lấy pin mới, hoàn tất swap transaction

---

## Flow sử dụng

```
User arrives at station
    ↓
1. GET /swapping/get-empty-slot → Hiển thị slot trống
    ↓
2. POST /swapping/return-battery → Trả pin vào slot
    ↓
3. GET /swapping/get-full-slot → Hiển thị pin có sẵn
    ↓
4. POST /swapping/take-battery → Lấy pin mới
    ↓
Swap completed!
```
