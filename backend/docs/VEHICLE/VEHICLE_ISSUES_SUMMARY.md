# Vehicle System - Issues Summary

**Status**: ⚠️ 6 Issues Found (Medium Risk)

---

## 🎯 Quick Overview

**Good News**: 
- ✅ Vehicle status transitions work well (only 2 states: active/inactive)
- ✅ Status automatically managed by subscription lifecycle
- ✅ No risk of invalid state transitions

**Bad News**:
- ❌ Missing validations in battery assignment
- ❌ No status sync when removing battery
- ❌ No ownership checks when reassigning vehicles

---

## 🚨 Critical Issues (P0)

### 1. ❌ updateBatteryId() - No Battery Validation

**Problem**:
```typescript
// Can assign non-existent or incompatible battery!
await updateBatteryId(vehicle_id, 999999);
// → Foreign key error at DB level (not caught)
// → No check: battery compatible with vehicle specs
```

**Fix**:
```typescript
async updateBatteryId(vehicle_id, battery_id, tx?) {
  const vehicle = await this.findOne(vehicle_id);
  const battery = await this.batteriesService.findOne(battery_id);
  
  // ✅ Validate compatibility
  if (battery.model !== vehicle.battery_model) {
    throw new BadRequestException('Battery model mismatch');
  }
  
  if (battery.type !== vehicle.battery_type) {
    throw new BadRequestException('Battery type mismatch');
  }
  
  return await prisma.vehicle.update({...});
}
```

---

### 2. ❌ removeBatteryFromVehicle() - No Status Sync

**Problem**:
```typescript
// Removes battery from vehicle but battery keeps status='in_use'
await removeBatteryFromVehicle(vehicle_id, tx);
// → Battery.vehicle_id = null ✅
// → Battery.status = 'in_use' ❌ (inconsistent!)
```

**Fix**:
```typescript
async removeBatteryFromVehicle(vehicle_id, tx) {
  const vehicle = await this.findOne(vehicle_id);
  
  if (!vehicle.battery_id) {
    throw new BadRequestException('Vehicle has no battery');
  }
  
  const battery = await this.batteriesService.findOne(vehicle.battery_id);
  
  // ✅ Don't allow removing in_use battery
  if (battery.status === BatteryStatus.in_use) {
    throw new BadRequestException(
      'Cannot remove battery in use. Return to station first.'
    );
  }
  
  return await tx.vehicle.update({...});
}
```

---

## ⚠️ High Priority Issues (P1)

### 3. ⚠️ assignVehicleToUser() - No Ownership Check

**Problem**:
```typescript
// Can reassign vehicle without checking subscriptions
await assignVehicleToUser({ vin: 'ABC123', user_id: 999 });
// → Original user loses vehicle
// → Active subscriptions become invalid
```

**Fix**:
```typescript
async assignVehicleToUser({ vin, user_id }) {
  const vehicle = await this.findByVin(vin);
  
  // ✅ Check active subscriptions
  if (vehicle.user_id && vehicle.user_id !== user_id) {
    const activeSubscriptions = await this.subscriptionsService
      .findActiveByVehicleId(vehicle.vehicle_id);
    
    if (activeSubscriptions.length > 0) {
      throw new BadRequestException(
        'Cannot reassign. Cancel subscriptions first.'
      );
    }
  }
  
  return await this.databaseService.vehicle.update({...});
}
```

---

### 4. ⚠️ Duplicate Battery Assignment Logic

**Problem**:
```typescript
// Two methods do same thing (in swapping flow)
await batteriesService.assignBatteryToVehicle(battery_id, vehicle_id, tx);
// ↑ Updates Battery.vehicle_id

await vehiclesService.updateBatteryId(vehicle_id, battery_id, tx);
// ↑ Updates Vehicle.battery_id

// Should be one atomic operation!
```

**Better**:
```typescript
// Make assignBatteryToVehicle update BOTH sides
async assignBatteryToVehicle(battery_id, vehicle_id, tx?) {
  // Update battery
  await db.battery.update({
    data: { vehicle_id, status: 'in_use' }
  });
  
  // ✅ Also update vehicle in same method
  await db.vehicle.update({
    data: { battery_id }
  });
}
```

---

## 💡 Medium Priority (P2)

### 5. 💡 No Vehicle Status Check in Swap

**Problem**:
```typescript
// swapping.service.ts doesn't check vehicle.status
const subscription = await this.subscriptionsService.findOne(...);
// ✅ Checks subscription

const vehicle = await this.vehiclesService.findOne(vehicle_id);
// ❌ Doesn't check if vehicle.status = 'active'
```

**Fix**:
```typescript
if (vehicle.status !== VehicleStatus.active) {
  throw new BadRequestException('Vehicle not active');
}
```

---

### 6. 💡 Admin Role in addVehicleToCurrentUser

**Problem**:
```typescript
@Roles($Enums.Role.driver, $Enums.Role.admin) // ← Both allowed
addVehicleToCurrentUser(@Body() dto, @Req() req) {
  // Admin shouldn't "own" vehicles, only manage them
}
```

**Fix**:
```typescript
@Roles($Enums.Role.driver) // ← Only drivers
```

---

## 📊 Issue Summary

| Issue | Severity | File | Method |
|-------|----------|------|--------|
| No battery validation | 🔴 High | vehicles.service.ts | updateBatteryId() |
| No status sync on remove | 🔴 High | vehicles.service.ts | removeBatteryFromVehicle() |
| No ownership check | 🟡 Medium | vehicles.service.ts | assignVehicleToUser() |
| Duplicate assignment | 🟡 Medium | swapping.service.ts | swapBatteries() |
| No vehicle status check | 🟢 Low | swapping.service.ts | swapBatteries() |
| Admin role confusion | 🟢 Low | vehicles.controller.ts | addVehicleToCurrentUser() |

---

## ✅ What Works Well

- ✅ Status transitions (active ↔ inactive) managed by subscriptions
- ✅ Transaction usage in critical operations
- ✅ Subscription validation before swapping
- ✅ VIN uniqueness enforced
- ✅ Role-based authorization

---

## 🔍 Comparison with Battery System

| Aspect | Battery System | Vehicle System |
|--------|---------------|----------------|
| Status complexity | 6 states | 2 states ✅ |
| Invalid transitions | Possible ❌ | Not possible ✅ |
| Main issues | Status validation | Relationship validation |
| Risk level | 🔴 High | 🟡 Medium |
| Manual updates | Many ❌ | Few ✅ (auto via subscriptions) |

---

## 🎯 Recommended Action

**Priority order**:

1. **P0**: Fix `updateBatteryId()` - Add battery validation
2. **P0**: Fix `removeBatteryFromVehicle()` - Add status sync
3. **P1**: Fix `assignVehicleToUser()` - Add ownership check
4. **P1**: Consolidate battery assignment logic
5. **P2**: Add vehicle status check in swap
6. **P2**: Restrict addVehicleToCurrentUser to drivers

---

## 📚 Full Analysis

See: `/backend/docs/VEHICLE_LOGIC_ANALYSIS.md` for complete details
