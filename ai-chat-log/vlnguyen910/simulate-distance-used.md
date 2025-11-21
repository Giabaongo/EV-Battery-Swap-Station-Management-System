NguyenVo-FPT: tui cần tính quãng đường đã đi sau mỗi đổi pin, tui ko có phần iot, chỉ cần tính kiểu giả lập đơn giản, hãy gợi ý một số cách tính cho tôi

GitHub Copilot: Dựa vào code của bạn, tôi có một số gợi ý để tính quãng đường giả lập đơn giản:

## Các phương pháp tính quãng đường giả lập

### 1. **Dựa vào dung lượng pin đã sử dụng** (Đơn giản nhất)

```typescript
// Công thức: km = (Battery Capacity Used) * Average km/kWh
const distance = (battery_returned.capacity - battery_taken.capacity) * 5; 
// Giả định: 1% pin = 5km (điều chỉnh theo loại xe)
```

### 2. **Dựa vào thời gian giữa 2 lần swap**

```typescript
// Công thức: km = Time (hours) * Average Speed
const timeInHours = (currentSwap - lastSwap) / (1000 * 60 * 60);
const distance = timeInHours * 40; // Giả định tốc độ TB 40km/h
```

### 3. **Dựa vào loại xe và gói dịch vụ** (Phức tạp hơn)

```typescript
// Tính theo profile của từng loại xe và pattern sử dụng
const vehicleProfile = {
  'scooter': { avgKmPerSwap: 50, variance: 10 },
  'motorcycle': { avgKmPerSwap: 80, variance: 15 },
  'car': { avgKmPerSwap: 150, variance: 30 }
};
```

### 4. **Kết hợp nhiều yếu tố** (Khuyến nghị)

```typescript
// Kết hợp: Battery capacity + Time + Random factor
const batteryUsed = battery_returned.capacity - battery_taken.capacity;
const timeHours = (currentTime - lastSwapTime) / (1000 * 60 * 60);
const baseDistance = batteryUsed * 5;
const timeAdjustment = Math.min(timeHours * 20, 100); // Max 100km adjustment
const randomFactor = 0.9 + Math.random() * 0.2; // ±10% variance
const distance = (baseDistance + timeAdjustment) * randomFactor;
```

## Implementation cho code của bạn

````typescript
// ...existing code...
async swapBatteries(swapDto: SwappingDto) {
    const { user_id, station_id } = swapDto;

    try {
        // ...existing code...

        // Perform the swap within a transaction
        return await this.databaseService.$transaction(async (prisma) => {
            // Get battery info before swap
            const returnedBattery = await this.batteriesService.findOne(return_battery_id);
            const takenBattery = await this.batteriesService.findOne(taken_battery_id);
            
            // Calculate distance traveled (Method 1: Simple battery-based)
            const batteryUsedPercent = returnedBattery.capacity - takenBattery.capacity;
            const kmPerPercent = 5; // Average 5km per 1% battery (adjust based on vehicle type)
            const distanceTraveled = Math.abs(batteryUsedPercent * kmPerPercent);
            
            // Alternative Method 2: Time-based with battery
            // const lastSwap = await this.swapTransactionsService.findLastSwapByVehicle(vehicle_id);
            // const timeHours = lastSwap ? (Date.now() - lastSwap.swap_time.getTime()) / (1000 * 60 * 60) : 0;
            // const distanceTraveled = (batteryUsedPercent * 5) + (timeHours * 20);

            await this.batteriesService.returnBatteryToStation(return_battery_id, station_id, prisma);
            await this.batteriesService.assignBatteryToVehicle(taken_battery_id, vehicle_id, prisma);
            await this.vehiclesService.updateBatteryId(vehicle_id, taken_battery_id, prisma);
            await this.subscriptionsService.incrementSwapUsed(subscription.subscription_id, prisma);
            
            // Update distance in subscription
            await this.subscriptionsService.updateDistance(subscription.subscription_id, distanceTraveled, prisma);

            // ...existing code...

            return {
                message: 'Battery swap successful',
                swap_used: subscription.swap_used,
                distance_traveled: distanceTraveled,
                swapTransaction: swapRecord,
                reservation_status: reservation ? ReservationStatus.completed : null
            }
        });

    } catch (error) {
        throw error;
    }
}
// ...existing code...
````

````typescript
// ...existing code...
async updateDistance(id: number, distance: number, tx?: any) {
    const db = tx ?? this.prisma;
    
    return db.subscription.update({
        where: { subscription_id: id },
        data: {
            distance_traveled: {
                increment: distance,
            },
        },
    });
}
// ...existing code...
````

**Khuyến nghị**: Sử dụng **Method 1** (dựa vào battery capacity) vì đơn giản, logic và phù hợp với business model của bạn.
