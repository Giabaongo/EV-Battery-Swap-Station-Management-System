# Vehicle System Logic Analysis

**Date**: November 11, 2025  
**Analyzed by**: AI Assistant  
**Status**: ⚠️ Issues Found

---

## 📋 System Overview

### Vehicle Schema
```prisma
model Vehicle {
  vehicle_id    Int           @id @default(autoincrement())
  user_id       Int?          // Nullable - can be unassigned
  battery_id    Int?  @unique // Nullable - can have no battery
  vin           String @unique
  battery_model String        // Required battery specs
  battery_type  String        // Required battery specs
  status        VehicleStatus @default(inactive)
}

enum VehicleStatus {
  active    // Has active subscription
  inactive  // No active subscription
}
```

**Key Relationships**:
- Vehicle → User (Many-to-One, optional)
- Vehicle → Battery (One-to-One, optional)
- Vehicle → Subscription (One-to-Many)

---

## 🔍 Current Status Transitions

### 1. Vehicle Status Changes

**Status Flow**:
```
inactive → active   (when subscription created)
active → inactive   (when subscription cancelled/expired)
```

**Transition Locations**:

#### T1: Create Subscription
- **File**: `subscriptions.service.ts` (Line 91)
- **Trigger**: New subscription created
- **Code**:
```typescript
await tx.vehicle.update({
  where: { vehicle_id },
  data: { status: VehicleStatus.active }
});
```
- **Validation**: ✅ Checks vehicle exists, belongs to user

---

#### T2: Cancel Subscription
- **File**: `subscriptions.service.ts` (Lines 268-274)
- **Trigger**: Subscription cancelled
- **Code**:
```typescript
if (!otherActiveSubscriptions) {
  await tx.vehicle.update({
    where: { vehicle_id },
    data: { status: VehicleStatus.inactive }
  });
}
```
- **Validation**: ✅ Checks for other active subscriptions

---

#### T3: Expire Subscription
- **File**: `subscriptions.service.ts` (Lines 436-442)
- **Trigger**: Scheduled job expires subscription
- **Code**:
```typescript
if (!otherActiveSubscriptions) {
  await tx.vehicle.update({
    where: { vehicle_id },
    data: { status: VehicleStatus.inactive }
  });
}
```
- **Validation**: ✅ Checks for other active subscriptions

---

### 2. Vehicle-Battery Assignment

**Operations**:

#### O1: Assign Battery to Vehicle
- **File**: `vehicles.service.ts` (Lines 123-128)
- **Method**: `updateBatteryId()`
- **Code**:
```typescript
async updateBatteryId(vehicle_id, battery_id, tx?) {
  const prisma = tx || this.databaseService;
  await this.findOne(vehicle_id); // Check vehicle exists
  return await prisma.vehicle.update({
    where: { vehicle_id },
    data: { battery_id }
  });
}
```
- **Issues**: 
  - ❌ No validation: battery exists
  - ❌ No validation: battery status = 'full'
  - ❌ No validation: battery compatible with vehicle

---

#### O2: Remove Battery from Vehicle
- **File**: `vehicles.service.ts` (Lines 132-148)
- **Method**: `removeBatteryFromVehicle()`
- **Code**:
```typescript
async removeBatteryFromVehicle(vehicle_id, tx) {
  const vehicle = await this.findOne(vehicle_id);
  if (!vehicle) {
    throw new NotFoundException(`Vehicle not found`);
  }
  
  return await tx.vehicle.update({
    where: { vehicle_id },
    data: { battery_id: null }
  });
}
```
- **Issues**:
  - ❌ No check: is battery currently in_use?
  - ❌ No update: battery status after removal
  - ⚠️ Used only in transaction context

---

#### O3: Battery Swap Process
- **File**: `swapping.service.ts` (Lines 93-94)
- **Code**:
```typescript
await this.batteriesService.assignBatteryToVehicle(taken_battery_id, vehicle_id, prisma);
await this.vehiclesService.updateBatteryId(vehicle_id, taken_battery_id, prisma);
```
- **Analysis**: 
  - ✅ Uses transaction
  - ✅ Calls battery validation first
  - ⚠️ Duplicate logic (battery already updated in assignBatteryToVehicle)

---

### 3. Vehicle-User Assignment

#### O4: Assign Vehicle to User
- **File**: `vehicles.service.ts` (Lines 150-166)
- **Method**: `assignVehicleToUser()`
- **Code**:
```typescript
async assignVehicleToUser({ vin, user_id }) {
  await this.userService.findOneById(user_id);   // ✅ Check user exists
  await this.findByVin(vin);                     // ✅ Check vehicle exists
  
  return await this.databaseService.vehicle.update({
    where: { vin },
    data: { user_id }
  });
}
```
- **Issues**:
  - ❌ No check: vehicle already assigned?
  - ❌ No check: user role (should be 'driver'?)
  - ⚠️ No validation: reassignment consequences

---

## 🚨 ISSUES FOUND

### Issue 1: updateBatteryId() - No Battery Validation ❌

**Problem**:
```typescript
// Can assign ANY battery_id without checks
await vehiclesService.updateBatteryId(vehicle_id, 999999);
// → No error even if battery doesn't exist!
```

**Consequences**:
- Foreign key violation at database level (not caught in code)
- No check if battery is compatible (model/type)
- No check if battery is available (status = 'full')

**Fix Needed**:
```typescript
async updateBatteryId(vehicle_id, battery_id, tx?) {
  const prisma = tx || this.databaseService;
  
  // ✅ Validate vehicle exists
  const vehicle = await this.findOne(vehicle_id);
  
  // ✅ Validate battery exists and compatible
  const battery = await this.batteriesService.findOne(battery_id);
  
  if (battery.model !== vehicle.battery_model) {
    throw new BadRequestException(
      `Battery model mismatch: vehicle requires ${vehicle.battery_model}, battery is ${battery.model}`
    );
  }
  
  if (battery.type !== vehicle.battery_type) {
    throw new BadRequestException(
      `Battery type mismatch: vehicle requires ${vehicle.battery_type}, battery is ${battery.type}`
    );
  }
  
  return await prisma.vehicle.update({
    where: { vehicle_id },
    data: { battery_id }
  });
}
```

---

### Issue 2: removeBatteryFromVehicle() - No Status Sync ❌

**Problem**:
```typescript
// Removes battery from vehicle, but battery still thinks it's in_use!
await removeBatteryFromVehicle(vehicle_id, tx);
// Battery.vehicle_id = null ✅
// Battery.status = 'in_use' ❌ (should be updated)
```

**Consequences**:
- Battery left in 'in_use' status without vehicle
- Inconsistent state: battery.vehicle_id = null but status = 'in_use'

**Fix Needed**:
```typescript
async removeBatteryFromVehicle(vehicle_id, tx) {
  const vehicle = await this.findOne(vehicle_id);
  
  if (!vehicle.battery_id) {
    throw new BadRequestException('Vehicle has no battery to remove');
  }
  
  // ✅ Update battery status when removing
  const battery = await this.batteriesService.findOne(vehicle.battery_id);
  
  if (battery.status === BatteryStatus.in_use) {
    // Should this battery go to charging or full?
    // Depends on business logic - probably shouldn't remove in_use battery
    throw new BadRequestException(
      'Cannot remove battery currently in use. Return to station first.'
    );
  }
  
  return await tx.vehicle.update({
    where: { vehicle_id },
    data: { battery_id: null }
  });
}
```

---

### Issue 3: assignVehicleToUser() - No Ownership Check ❌

**Problem**:
```typescript
// Can reassign vehicle from one user to another without checks
await assignVehicleToUser({ vin: 'ABC123', user_id: 999 });
// → No warning if vehicle already owned
// → No check on existing subscriptions
```

**Consequences**:
- Vehicle reassigned without handling subscriptions
- Original user loses access to their vehicle
- Active subscription may become invalid

**Fix Needed**:
```typescript
async assignVehicleToUser({ vin, user_id }) {
  await this.userService.findOneById(user_id);
  const vehicle = await this.findByVin(vin);
  
  // ✅ Check if already assigned
  if (vehicle.user_id && vehicle.user_id !== user_id) {
    // Check if has active subscriptions
    const activeSubscriptions = await this.subscriptionsService.findActiveByVehicleId(
      vehicle.vehicle_id
    );
    
    if (activeSubscriptions.length > 0) {
      throw new BadRequestException(
        `Cannot reassign vehicle. Vehicle has ${activeSubscriptions.length} active subscription(s). Please cancel subscriptions first.`
      );
    }
  }
  
  this.logger.log(`Assigning vehicle ${vin} from user ${vehicle.user_id} to user ${user_id}`);
  
  return await this.databaseService.vehicle.update({
    where: { vin },
    data: { user_id }
  });
}
```

---

### Issue 4: Duplicate Battery Assignment Logic ⚠️

**Problem**:
```typescript
// In swapping.service.ts
await this.batteriesService.assignBatteryToVehicle(taken_battery_id, vehicle_id, prisma);
// ↑ Updates Battery.vehicle_id and Battery.status

await this.vehiclesService.updateBatteryId(vehicle_id, taken_battery_id, prisma);
// ↑ Updates Vehicle.battery_id

// Two separate operations for one logical action
```

**Issues**:
- Not atomic if first succeeds but second fails
- Harder to maintain
- Already in transaction, but conceptually duplicated

**Better Approach**:
```typescript
// assignBatteryToVehicle should handle BOTH sides
async assignBatteryToVehicle(battery_id, vehicle_id, tx?) {
  const db = tx ?? this.databaseService;
  
  // Update battery
  const battery = await db.battery.update({
    where: { battery_id },
    data: { vehicle_id, station_id: null, status: 'in_use' }
  });
  
  // Update vehicle (in same method)
  await db.vehicle.update({
    where: { vehicle_id },
    data: { battery_id }
  });
  
  return battery;
}

// Then in swapping.service.ts:
await this.batteriesService.assignBatteryToVehicle(taken_battery_id, vehicle_id, prisma);
// No need for separate updateBatteryId call
```

---

### Issue 5: No Vehicle Status Validation in Swap ⚠️

**Problem**:
```typescript
// swapping.service.ts - no check on vehicle status
const vehicle = await this.vehiclesService.findOne(vehicle_id);
// ✅ Checks subscription status
// ❌ Doesn't check vehicle.status

// What if vehicle.status = 'inactive' but subscription exists?
```

**Risk**: Edge case data inconsistency

**Fix Needed**:
```typescript
const vehicle = await this.vehiclesService.findOne(vehicle_id);

if (vehicle.status !== VehicleStatus.active) {
  throw new BadRequestException(
    'Vehicle is not active. Please ensure vehicle has active subscription.'
  );
}
```

---

### Issue 6: No Role Validation in addVehicleToCurrentUser ⚠️

**Problem**:
```typescript
// vehicles.controller.ts
@Roles($Enums.Role.driver, $Enums.Role.admin)
addVehicleToCurrentUser(@Body() addVehicleDto, @Req() req) {
  // Allows both driver AND admin
  // But admin shouldn't "own" vehicles, only manage them
}
```

**Risk**: Admins accidentally assigning vehicles to themselves

**Fix Needed**:
```typescript
@Roles($Enums.Role.driver) // Only drivers
addVehicleToCurrentUser(@Body() addVehicleDto, @Req() req) {
  // ...
}
```

---

## 📊 Summary Table

| Issue | Severity | Impact | Method |
|-------|----------|--------|--------|
| No battery validation in updateBatteryId | 🔴 High | FK violations, incompatible batteries | updateBatteryId() |
| No status sync in removeBattery | 🔴 High | Inconsistent battery states | removeBatteryFromVehicle() |
| No ownership check in assign | 🟡 Medium | Subscription conflicts | assignVehicleToUser() |
| Duplicate assignment logic | 🟡 Medium | Maintenance burden | Swap flow |
| No vehicle status check in swap | 🟡 Medium | Edge case inconsistency | swapBatteries() |
| Admin can own vehicles | 🟢 Low | Role confusion | addVehicleToCurrentUser() |

---

## ✅ What's Working Well

1. ✅ **Status transitions** - Active/Inactive properly managed via subscriptions
2. ✅ **Transaction usage** - Critical operations in transactions
3. ✅ **Subscription checks** - Validates subscription before swapping
4. ✅ **User existence** - Always checks user exists
5. ✅ **VIN uniqueness** - Enforced at database level
6. ✅ **Role guards** - Basic authorization in place

---

## 🎯 Recommended Fixes (Priority Order)

### P0 (Critical)
1. **Add battery validation in `updateBatteryId()`**
   - Check battery exists
   - Validate compatibility (model/type)
   - Verify battery available

2. **Fix `removeBatteryFromVehicle()` status sync**
   - Don't allow removing in_use battery
   - Or handle status transition properly

### P1 (High)
3. **Add ownership validation in `assignVehicleToUser()`**
   - Check for active subscriptions before reassign
   - Warn about ownership transfer

4. **Consolidate battery assignment logic**
   - Make `assignBatteryToVehicle` update both sides
   - Remove duplicate `updateBatteryId` call

### P2 (Medium)
5. **Add vehicle status check in swap**
   - Ensure vehicle.status = 'active'

6. **Restrict `addVehicleToCurrentUser` to drivers only**
   - Remove admin from @Roles decorator

---

## 📝 Notes

**Key Difference from Battery System**:
- Vehicle status is **simpler** (only 2 states: active/inactive)
- Status driven by **subscription lifecycle** (not manual transitions)
- Main issues are in **relationship management** (battery assignment, user ownership)
- **Less critical** than battery issues (status transitions are automatic and reliable)

**Risk Assessment**: 
- 🟡 **MEDIUM RISK** overall
- Status transitions: ✅ Working well
- Relationship management: ⚠️ Needs validation improvements
- No invalid state transitions possible (only 2 states)

