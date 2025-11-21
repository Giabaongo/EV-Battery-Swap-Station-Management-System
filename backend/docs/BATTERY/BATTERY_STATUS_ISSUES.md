# Battery Status Logic - Issues Summary

## 🔴 Critical Issues Found (6)

### 1. ❌ No Validation in `returnBatteryToStation()`
**Current Code**:
```typescript
// ⚠️ Không check current status!
await db.battery.update({
  data: { status: BatteryStatus.charging }
});
```

**Problem**: 
- Battery 'defective' có thể bị set về 'charging' ❌
- Battery 'booked' bị force về 'charging' ❌
- Battery 'full' (100%) vẫn bị set 'charging' ❌

**Fix**: Validate battery.status === 'in_use' trước khi return

---

### 2. ❌ No Validation in `updateBatteryStatus()`
**Current Code**:
```typescript
// ⚠️ Cho phép bất kỳ status → bất kỳ status
await prisma.battery.update({
  data: { status } // No validation!
});
```

**Problem**:
- 'defective' → 'full' (không hợp lý)
- 'in_use' → 'full' (phải qua charging)
- 'charging' → 'in_use' (phải full trước)

**Fix**: Implement valid transition map

---

### 3. ❌ Charge/Status Inconsistency
**Problem**:
```typescript
// Admin set charge = 50%
setBatteryCharge(battery_id, 50);
// → Status vẫn là 'full' (sai logic!)

// Battery 100% nhưng status = 'charging'
// Không auto chuyển sang 'full'
```

**Fix**: Auto-update status khi charge thay đổi

---

### 4. ❌ No Recovery from 'defective'
**Problem**: 
- Battery hỏng → mark 'defective'
- Sau sửa chữa → không có workflow để quay lại
- Status 'defective' là dead-end

**Fix**: Add `markBatteryRepaired()` method

---

### 5. ⚠️ 'in_transit' Status Not Used
**Problem**: 
- Enum có 'in_transit' nhưng không có code nào dùng
- Transfer ticket system chưa implement

**Fix**: Implement hoặc remove

---

### 6. ⚠️ Missing Low Battery Alerts
**Problem**: 
- Battery xả xuống 5%, 10% không có cảnh báo
- Driver không biết khi nào cần swap

**Fix**: Add monitoring + notifications

---

## 🔄 Valid Status Transitions (Proposed)

```
full → in_use          ✅ (swap to vehicle)
full → booked          ✅ (reservation)
full → defective       ✅ (admin mark)
full → in_transit      ✅ (transfer)

in_use → charging      ✅ (return to station)
in_use → defective     ✅ (mark while in use)

charging → full        ✅ (charge = 100%)
charging → defective   ✅ (found defect)

booked → full          ✅ (cancel or use)
booked → defective     ✅ (found defect)

defective → charging   ✅ (after repair)

in_transit → charging  ✅ (arrive, need charge)
in_transit → full      ✅ (arrive, already charged)
```

**Invalid Transitions**:
```
in_use → full          ❌ (phải qua charging)
charging → in_use      ❌ (phải full trước)
booked → in_use        ❌ (phải qua full)
defective → in_use     ❌ (phải sửa + charge)
```

---

## 🛠️ Quick Fixes Needed

### Fix 1: Validate `returnBatteryToStation()`
```typescript
async returnBatteryToStation(battery_id, station_id, tx?) {
  const battery = await this.findOne(battery_id);
  
  // ✅ ADD THIS
  if (battery.status !== BatteryStatus.in_use) {
    throw new BadRequestException(
      `Cannot return battery with status '${battery.status}'`
    );
  }
  
  // ✅ Smart status selection
  const charge = Number(battery.current_charge);
  const targetStatus = charge >= 100 
    ? BatteryStatus.full 
    : BatteryStatus.charging;
  
  return await db.battery.update({
    data: { 
      station_id, 
      vehicle_id: null, 
      status: targetStatus // ✅
    },
  });
}
```

---

### Fix 2: Add Transition Validation
```typescript
async updateBatteryStatus(id, newStatus, tx?, skipValidation = false) {
  const battery = await this.findOne(id);
  
  if (!skipValidation) {
    this.validateStatusTransition(battery.status, newStatus);
  }
  
  // ✅ Validate charge level
  if (newStatus === 'full' && battery.current_charge < 100) {
    throw new BadRequestException('Cannot set full when charge < 100%');
  }
  
  return await prisma.battery.update({
    data: { status: newStatus }
  });
}

private validateStatusTransition(current, target) {
  const validMap = {
    full: ['in_use', 'booked', 'defective', 'in_transit'],
    in_use: ['charging', 'defective'],
    charging: ['full', 'defective'],
    booked: ['full', 'defective'],
    defective: ['charging', 'full'],
    in_transit: ['full', 'charging', 'defective'],
  };
  
  if (!validMap[current].includes(target)) {
    throw new BadRequestException(
      `Invalid: ${current} → ${target}`
    );
  }
}
```

---

### Fix 3: Auto-Update Status on Charge Change
```typescript
async setBatteryCharge(battery_id, charge_percentage) {
  const battery = await this.findOne(battery_id);
  let newStatus = battery.status;
  
  // ✅ Auto adjust status
  if (charge_percentage >= 100 && battery.status === 'charging') {
    newStatus = BatteryStatus.full;
  } else if (charge_percentage < 100 && battery.status === 'full') {
    if (battery.station_id) {
      newStatus = BatteryStatus.charging;
    }
  }
  
  return await this.databaseService.battery.update({
    data: { 
      current_charge: charge_percentage,
      status: newStatus // ✅ Update if needed
    }
  });
}
```

---

### Fix 4: Add Defective Recovery
```typescript
async markBatteryRepaired(battery_id: number) {
  const battery = await this.findOne(battery_id);
  
  if (battery.status !== 'defective') {
    throw new BadRequestException('Battery is not defective');
  }
  
  if (!battery.station_id) {
    throw new BadRequestException('Battery must be at station');
  }
  
  return await this.databaseService.battery.update({
    where: { battery_id },
    data: { 
      status: BatteryStatus.charging,
      current_charge: 0 // Reset after repair
    }
  });
}
```

---

## 📊 Priority

| Priority | Issue | Impact | Effort |
|----------|-------|--------|--------|
| P0 🔥 | No validation in `returnBatteryToStation()` | High | Low |
| P0 🔥 | No validation in `updateBatteryStatus()` | High | Medium |
| P0 🔥 | Charge/Status inconsistency | High | Low |
| P1 ⚠️ | No defective recovery | Medium | Low |
| P1 ⚠️ | Missing low battery alerts | Medium | Medium |
| P2 💡 | 'in_transit' not used | Low | Medium |

---

## 📝 Testing Checklist

After fixes:
- [ ] Test: Cannot return 'defective' battery to station
- [ ] Test: Cannot return 'booked' battery to station  
- [ ] Test: Cannot set 'full' when charge < 100%
- [ ] Test: Cannot transition 'in_use' → 'full' directly
- [ ] Test: Auto 'full' when charging reaches 100%
- [ ] Test: setBatteryCharge auto-updates status
- [ ] Test: markBatteryRepaired works
- [ ] Test: Valid transitions work
- [ ] Test: Invalid transitions blocked

---

## 🎯 Full Analysis

See: `/backend/docs/BATTERY_STATUS_ANALYSIS.md` for complete details
