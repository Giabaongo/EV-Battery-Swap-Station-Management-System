# Battery Status Logic Analysis

## 📊 Current Status Definitions

```prisma
enum BatteryStatus {
  full        // Battery đầy 100%, sẵn sàng swap
  charging    // Battery đang sạc tại trạm
  booked      // Battery đã được đặt trước (reservation)
  defective   // Battery hỏng, không thể dùng
  in_use      // Battery đang được dùng trên vehicle
  in_transit  // Battery đang vận chuyển giữa các trạm
}
```

---

## ✅ Current Status Transitions

### 1. **full → in_use** (Assign to Vehicle)
**Method**: `assignBatteryToVehicle()`
```typescript
// Validation: Battery must be 'full'
if (battery.status !== 'full') {
  throw new BadRequestException('Battery is not full');
}

// Transition
status: BatteryStatus.in_use
vehicle_id: <assigned>
station_id: null
```

**Use Case**: 
- Driver swap battery tại station
- First swap (initialize battery)

---

### 2. **in_use → charging** (Return to Station)
**Method**: `returnBatteryToStation()`
```typescript
// No validation on current status ⚠️
// Just set to charging

status: BatteryStatus.charging
station_id: <assigned>
vehicle_id: null
```

**Use Case**: 
- Driver swap battery, trả battery cũ về station

---

### 3. **charging → full** (Charging Complete)
**Method**: `simulateCharging()`
```typescript
// Validation: Battery must be 'charging'
if (battery.status !== BatteryStatus.charging) {
  throw new BadRequestException('Only batteries with status charging can be charged');
}

// Auto transition when charge = 100%
status: targetCharge >= 100 ? BatteryStatus.full : BatteryStatus.charging
```

**Use Case**: 
- Background job hoặc manual simulate charging
- Auto chuyển sang 'full' khi đạt 100%

---

### 4. **full → booked** (Reservation)
**Method**: `reservations.create()` → `updateBatteryStatus()`
```typescript
// When creating reservation
await batteriesService.updateBatteryStatus(battery_id, BatteryStatus.booked);
```

**Use Case**: 
- User tạo reservation cho battery cụ thể

---

### 5. **booked → full** (Reservation Cancelled/Used)
**Method**: 
- `reservations.updateStatus()` (cancel) → set to 'full'
- `swapping.swapBatteries()` (used with reservation) → set to 'full' trước khi assign

```typescript
// Cancel reservation
await batteriesService.updateBatteryStatus(battery_id, BatteryStatus.full);

// Use in swap
if (reservation && reservation.vehicle_id === vehicle_id) {
  await batteriesService.updateBatteryStatus(taken_battery_id, BatteryStatus.full);
}
```

---

### 6. **Any → defective** (Admin Mark Defective)
**Method**: `updateBatteryStatus()` - Direct admin call
```typescript
// No specific method, admin can call updateBatteryStatus directly
await batteriesService.updateBatteryStatus(battery_id, BatteryStatus.defective);
```

**Use Case**: 
- Admin phát hiện battery hỏng
- Maintenance marking

---

### 7. **Any → in_transit** (Transfer Between Stations)
**Method**: Battery transfer ticket system (not fully implemented)
```typescript
// Presumably in battery transfer logic
status: BatteryStatus.in_transit
```

**Use Case**: 
- Di chuyển battery giữa các station

---

## 🔴 ISSUES FOUND

### ❌ Issue 1: `returnBatteryToStation()` - No Status Validation
```typescript
async returnBatteryToStation(battery_id, station_id, tx?) {
  // ⚠️ KHÔNG CHECK current status!
  // Battery có thể là 'booked', 'defective', 'full'... vẫn set về 'charging'
  
  return await db.battery.update({
    data: { station_id, vehicle_id: null, status: BatteryStatus.charging },
  });
}
```

**Problem**: 
- Battery 'defective' có thể bị set về 'charging'
- Battery 'booked' có thể bị force về 'charging'
- Battery 'full' không cần sạc lại nhưng vẫn bị set 'charging'

**Fix Needed**: Validate current status trước khi transition

---

### ❌ Issue 2: `updateBatteryStatus()` - No Validation
```typescript
async updateBatteryStatus(id: number, status: BatteryStatus, tx?: any) {
  // ⚠️ KHÔNG validate status transition hợp lệ!
  // Cho phép bất kỳ status nào → bất kỳ status nào
  
  const updatedBattery = await prisma.battery.update({
    where: { battery_id: id },
    data: { status },
  });
  return updatedBattery;
}
```

**Problem**: 
- Có thể chuyển trực tiếp 'defective' → 'full' (không hợp lý)
- Có thể chuyển 'in_use' → 'charging' mà không return về station
- Không kiểm tra điều kiện (ví dụ: charge level khi chuyển sang 'full')

**Fix Needed**: Implement status transition validation logic

---

### ❌ Issue 3: Missing Status - 'available'
**Problem**: Không có status 'available' hoặc 'idle'
- Battery tại station nhưng chưa full (< 100%) không có status rõ ràng
- Battery mới thêm vào hệ thống có status gì?

**Fix Needed**: Consider thêm status hoặc define rõ hơn 'full' vs 'charging'

---

### ❌ Issue 4: `defective` Status - No Recovery Path
**Problem**: 
- Không có logic để battery từ 'defective' → status khác
- Sau khi sửa chữa, làm sao đưa battery quay lại hệ thống?

**Fix Needed**: Add recovery workflow cho defective batteries

---

### ❌ Issue 5: `in_transit` Status - Not Used
**Problem**: 
- Status exists nhưng không có code nào sử dụng
- Transfer ticket system chưa implement đầy đủ

**Fix Needed**: Implement hoặc remove status này

---

### ⚠️ Issue 6: Charge Level Inconsistency
**Problem**: 
- Battery có thể có status 'full' nhưng current_charge < 100%
- Battery status 'charging' nhưng current_charge = 100% (trước khi simulateCharging chạy)

**Example**:
```typescript
// Admin set charge về 50%
setBatteryCharge(battery_id, 50);
// → status vẫn là 'full' hoặc gì đó, không tự động chuyển
```

**Fix Needed**: Validate charge level khi update status

---

## 🔄 Recommended Status Transition Rules

### Valid Transitions:
```
full → in_use          ✅ (swap to vehicle)
full → booked          ✅ (reservation)
full → defective       ✅ (admin mark)
full → in_transit      ✅ (transfer)

in_use → charging      ✅ (return to station) - NEED VALIDATION
in_use → defective     ✅ (mark while in use)

charging → full        ✅ (charge complete, charge = 100%)
charging → defective   ✅ (found defect while charging)

booked → full          ✅ (cancel reservation or use in swap)
booked → defective     ✅ (found defect)

defective → charging   ✅ (after repair, need recharge)
defective → full       ⚠️ (only if charge = 100% after repair)

in_transit → full      ✅ (arrive at station, already charged)
in_transit → charging  ✅ (arrive at station, need charge)
in_transit → defective ✅ (damage during transit)
```

### Invalid Transitions (Should Block):
```
in_use → full          ❌ (must go through return + charging)
charging → in_use      ❌ (must be full first)
booked → in_use        ❌ (must go through full first, or cancel)
defective → in_use     ❌ (must repair + charge first)
in_transit → in_use    ❌ (must arrive at station first)
```

---

## 🛠️ Proposed Fixes

### Fix 1: Add Status Transition Validation

```typescript
async updateBatteryStatus(
  id: number, 
  newStatus: BatteryStatus, 
  tx?: any,
  skipValidation: boolean = false // For admin override
) {
  const battery = await this.findOne(id);
  
  if (!skipValidation) {
    this.validateStatusTransition(battery.status, newStatus, battery);
  }
  
  // Additional validations
  if (newStatus === BatteryStatus.full) {
    if (Number(battery.current_charge) < 100) {
      throw new BadRequestException(
        `Cannot set status to 'full' when charge is ${battery.current_charge}%`
      );
    }
  }
  
  const updatedBattery = await (tx ?? this.databaseService).battery.update({
    where: { battery_id: id },
    data: { status: newStatus },
  });
  
  this.logger.log(
    `Battery ${id} status changed: ${battery.status} → ${newStatus}`
  );
  
  return updatedBattery;
}

private validateStatusTransition(
  currentStatus: BatteryStatus,
  newStatus: BatteryStatus,
  battery: any
) {
  const validTransitions: Record<BatteryStatus, BatteryStatus[]> = {
    full: ['in_use', 'booked', 'defective', 'in_transit'],
    in_use: ['charging', 'defective'],
    charging: ['full', 'defective'],
    booked: ['full', 'defective'],
    defective: ['charging', 'full'], // After repair
    in_transit: ['full', 'charging', 'defective'],
  };
  
  const allowed = validTransitions[currentStatus] || [];
  
  if (!allowed.includes(newStatus)) {
    throw new BadRequestException(
      `Invalid status transition: ${currentStatus} → ${newStatus}. ` +
      `Allowed transitions: ${allowed.join(', ')}`
    );
  }
}
```

---

### Fix 2: Update `returnBatteryToStation()`

```typescript
async returnBatteryToStation(
  battery_id: number,
  station_id: number,
  tx?: any
) {
  const db = tx ?? this.databaseService;
  const battery = await this.findOne(battery_id);
  
  // ✅ Validate current status
  if (battery.status !== BatteryStatus.in_use) {
    throw new BadRequestException(
      `Cannot return battery with status '${battery.status}'. ` +
      `Only batteries 'in_use' can be returned.`
    );
  }
  
  // Check if station exists
  const station = await this.stationsService.findOne(station_id);
  
  // Determine target status based on charge level
  const charge = Number(battery.current_charge);
  const targetStatus = charge >= 100 
    ? BatteryStatus.full 
    : BatteryStatus.charging;
  
  this.logger.log(
    `Returning battery ${battery_id} to station ${station_id}. ` +
    `Charge: ${charge}%, Status: ${battery.status} → ${targetStatus}`
  );
  
  return await db.battery.update({
    where: { battery_id },
    data: { 
      station_id, 
      vehicle_id: null, 
      status: targetStatus 
    },
  });
}
```

---

### Fix 3: Auto Update Status on Charge Change

```typescript
async setBatteryCharge(battery_id: number, charge_percentage: number) {
  const battery = await this.findOne(battery_id);
  const previousCharge = Number(battery.current_charge);
  
  // ✅ Auto adjust status based on charge
  let newStatus = battery.status;
  
  if (charge_percentage >= 100 && battery.status === BatteryStatus.charging) {
    newStatus = BatteryStatus.full;
  } else if (charge_percentage < 100 && battery.status === BatteryStatus.full) {
    // If battery was full but charge dropped, change to charging
    if (battery.station_id) {
      newStatus = BatteryStatus.charging;
    }
  }
  
  const updatedBattery = await this.databaseService.battery.update({
    where: { battery_id },
    data: { 
      current_charge: charge_percentage,
      status: newStatus // ✅ Update status if needed
    },
    include: { vehicle: true, station: true },
  });
  
  if (newStatus !== battery.status) {
    this.logger.log(
      `Battery ${battery_id} status auto-changed: ${battery.status} → ${newStatus} ` +
      `(due to charge change: ${previousCharge}% → ${charge_percentage}%)`
    );
  }
  
  return {
    battery_id: updatedBattery.battery_id,
    previous_charge: previousCharge,
    current_charge: charge_percentage,
    previous_status: battery.status,
    current_status: newStatus,
    status_changed: newStatus !== battery.status,
    // ...
  };
}
```

---

### Fix 4: Add Defective Recovery Workflow

```typescript
/**
 * Mark battery as repaired and ready for charging
 */
async markBatteryRepaired(battery_id: number) {
  const battery = await this.findOne(battery_id);
  
  if (battery.status !== BatteryStatus.defective) {
    throw new BadRequestException(
      `Battery ${battery_id} is not marked as defective`
    );
  }
  
  if (!battery.station_id) {
    throw new BadRequestException(
      `Defective battery must be at a station before repair`
    );
  }
  
  // Reset to charging status for recharge
  const updatedBattery = await this.databaseService.battery.update({
    where: { battery_id },
    data: { 
      status: BatteryStatus.charging,
      current_charge: 0, // Reset charge after repair
    },
  });
  
  this.logger.log(
    `Battery ${battery_id} marked as repaired. Status: defective → charging`
  );
  
  return updatedBattery;
}
```

---

## 📋 Missing Features

### 1. **Low Battery Alert**
```typescript
async checkLowBattery(battery_id: number): Promise<boolean> {
  const battery = await this.findOne(battery_id);
  const charge = Number(battery.current_charge);
  
  const LOW_BATTERY_THRESHOLD = 20; // 20%
  
  if (charge <= LOW_BATTERY_THRESHOLD && battery.status === BatteryStatus.in_use) {
    this.logger.warn(
      `⚠️ Low battery alert! Battery ${battery_id} at ${charge}%`
    );
    // TODO: Send notification to driver
    return true;
  }
  
  return false;
}
```

### 2. **Battery Health Monitoring**
```typescript
async checkBatteryHealth(battery_id: number) {
  const battery = await this.findOne(battery_id);
  const soh = Number(battery.soh); // State of Health
  
  const CRITICAL_SOH = 70; // 70%
  const WARNING_SOH = 80; // 80%
  
  if (soh < CRITICAL_SOH) {
    this.logger.error(
      `🔴 Critical battery health! Battery ${battery_id} SOH: ${soh}%`
    );
    // Auto mark as defective?
    await this.updateBatteryStatus(battery_id, BatteryStatus.defective);
  } else if (soh < WARNING_SOH) {
    this.logger.warn(
      `⚠️ Warning battery health! Battery ${battery_id} SOH: ${soh}%`
    );
  }
  
  return {
    battery_id,
    soh,
    health_status: soh >= WARNING_SOH ? 'good' : soh >= CRITICAL_SOH ? 'warning' : 'critical',
  };
}
```

### 3. **Status History Tracking**
Consider thêm table `BatteryStatusHistory`:
```prisma
model BatteryStatusHistory {
  id          Int           @id @default(autoincrement())
  battery_id  Int
  from_status BatteryStatus
  to_status   BatteryStatus
  changed_by  Int?          // user_id hoặc system
  reason      String?
  created_at  DateTime      @default(now())
  
  battery     Battery       @relation(fields: [battery_id], references: [battery_id])
  
  @@map("battery_status_history")
}
```

---

## 🎯 Priority Fixes

### High Priority (P0)
1. ✅ Add validation to `returnBatteryToStation()` - Check status is 'in_use'
2. ✅ Add status transition validation to `updateBatteryStatus()`
3. ✅ Auto-update status when charge changes in `setBatteryCharge()`

### Medium Priority (P1)
4. ⚠️ Add defective recovery workflow (`markBatteryRepaired()`)
5. ⚠️ Implement low battery alerts
6. ⚠️ Add battery health monitoring

### Low Priority (P2)
7. 💡 Status history tracking
8. 💡 Implement or remove `in_transit` status
9. 💡 Add bulk status operations

---

## 📊 Status Diagram (Current vs Proposed)

### Current (Has Issues):
```
         ┌──────┐
    ┌───→│ full │←─────────┐
    │    └──┬───┘          │
    │       │              │
    │       ↓              │
    │   ┌────────┐    ┌─────────┐
    │   │ in_use │    │ booked  │
    │   └───┬────┘    └────┬────┘
    │       │              │
    │       ↓              │
    │  ┌──────────┐        │
    └──│ charging │←───────┘
       └──────────┘
       
    defective (isolated, no recovery)
    in_transit (not used)
```

### Proposed (With Validation):
```
         ┌──────┐
    ┌───→│ full │←──────────┬────────┐
    │    └──┬───┘           │        │
    │       │               │        │
    │       ↓               │        │
    │   ┌────────┐     ┌────────┐   │
    │   │ in_use │     │ booked │   │
    │   └───┬────┘     └────┬───┘   │
    │       │               │        │
    │       ↓               ↓        │
    │  ┌──────────┐    (cancel)     │
    └──│ charging │────────┘         │
       └────┬─────┘                  │
            │                        │
            ↓                        │
       ┌───────────┐                 │
       │ defective │─────repair──────┘
       └───────────┘
       
    in_transit ──→ charging/full (after transfer)
```

---

## ✅ Summary

**Total Issues Found**: 6 major issues

**Critical Issues**: 3
1. No validation in `returnBatteryToStation()`
2. No validation in `updateBatteryStatus()`
3. Charge/Status inconsistency

**Missing Features**: 3
1. Low battery alerts
2. Battery health monitoring
3. Defective recovery workflow

**Unused Features**: 1
1. `in_transit` status not implemented

**Recommended Actions**:
1. Implement status transition validation ⭐
2. Add charge-based status auto-update ⭐
3. Fix `returnBatteryToStation()` validation ⭐
4. Add defective recovery workflow
5. Implement battery health checks
6. Consider status history tracking
