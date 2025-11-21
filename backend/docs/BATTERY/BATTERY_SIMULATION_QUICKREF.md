# Battery Simulation - Quick Reference

## 🔋 3 APIs chính

### 1. Simulate Discharge (Giả lập di chuyển)
```bash
POST /api/v1/batteries/simulate-discharge
{
  "battery_id": 1,
  "decrease_amount": 15  # Optional: giảm 15%, hoặc để trống = random 5-20%
}
```

### 2. Set Charge (Admin set cụ thể)
```bash
PATCH /api/v1/batteries/set-charge
{
  "battery_id": 1,
  "charge_percentage": 50  # Set về 50%
}
```

### 3. Simulate Charging (Giả lập sạc)
```bash
POST /api/v1/batteries/simulate-charging
{
  "battery_id": 2,
  "increase_amount": 25  # Optional: tăng 25%, hoặc để trống = random 10-30%
}
```

## ⚡ Quick Examples

**Driver di chuyển 50km:**
```bash
curl -X POST http://localhost:3000/api/v1/batteries/simulate-discharge \
  -H "Content-Type: application/json" \
  -d '{"battery_id": 1, "decrease_amount": 15}'
```

**Set battery về 20% để test:**
```bash
curl -X PATCH http://localhost:3000/api/v1/batteries/set-charge \
  -H "Content-Type: application/json" \
  -d '{"battery_id": 1, "charge_percentage": 20}'
```

**Sạc battery:**
```bash
curl -X POST http://localhost:3000/api/v1/batteries/simulate-charging \
  -H "Content-Type: application/json" \
  -d '{"battery_id": 2, "increase_amount": 30}'
```

## 📋 Requirements

| API | Battery Status | Notes |
|-----|---------------|-------|
| `simulate-discharge` | `in_use` | Chỉ battery đang được dùng mới xả được |
| `set-charge` | Any | Admin có thể set bất kỳ battery |
| `simulate-charging` | `charging` | Chỉ battery đang sạc mới tăng được |

## 🎯 Common Scenarios

**Test low battery warning:**
```bash
# Set về 15%
PATCH /batteries/set-charge
{"battery_id": 1, "charge_percentage": 15}
```

**Simulate long trip:**
```bash
# Giảm 3 lần, mỗi lần 15-20%
POST /batteries/simulate-discharge {"battery_id": 1}
POST /batteries/simulate-discharge {"battery_id": 1}
POST /batteries/simulate-discharge {"battery_id": 1}
```

**Charge battery to full:**
```bash
# Sạc từ 30% lên 100%
POST /batteries/simulate-charging {"battery_id": 2, "increase_amount": 70}
# Auto chuyển status = 'full' khi đạt 100%
```
