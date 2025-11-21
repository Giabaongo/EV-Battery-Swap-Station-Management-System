# Battery Simulation APIs

APIs để giả lập việc sử dụng và sạc pin (simulate driver di chuyển).

## 📋 Table of Contents

1. [Simulate Battery Discharge](#1-simulate-battery-discharge) - Giả lập xả pin khi di chuyển
2. [Set Battery Charge](#2-set-battery-charge) - Set charge cụ thể (admin)
3. [Simulate Battery Charging](#3-simulate-battery-charging) - Giả lập sạc pin tại trạm

---

## 1. Simulate Battery Discharge

**Endpoint**: `POST /api/v1/batteries/simulate-discharge`

**Mô tả**: Giảm `current_charge` của battery để simulate driver di chuyển.

**Auth**: Required (driver/admin)

**Điều kiện**: Battery phải có `status = 'in_use'`

### Request Body

```typescript
{
  battery_id: number;          // Required
  new_charge?: number;         // Optional: Set về % cụ thể (0-100)
  decrease_amount?: number;    // Optional: Giảm bao nhiêu % (0-100)
}
```

**Logic**:
- Nếu có `new_charge` → Set về giá trị đó
- Nếu có `decrease_amount` → Giảm theo số lượng cụ thể
- Nếu không có gì → Random giảm 5-20%

### Response

```json
{
  "battery_id": 1,
  "previous_charge": 85,
  "current_charge": 70,
  "decrease_amount": 15,
  "status": "in_use",
  "vehicle": {
    "vehicle_id": 3,
    "vin": "VIN123456",
    "user_id": 4
  },
  "message": "Battery discharged from 85% to 70%"
}
```

### Examples

**Example 1: Random decrease (5-20%)**
```bash
POST /api/v1/batteries/simulate-discharge
{
  "battery_id": 1
}
```

**Example 2: Decrease by specific amount**
```bash
POST /api/v1/batteries/simulate-discharge
{
  "battery_id": 1,
  "decrease_amount": 15  # Giảm 15%
}
```

**Example 3: Set to specific charge**
```bash
POST /api/v1/batteries/simulate-discharge
{
  "battery_id": 1,
  "new_charge": 30  # Set về 30%
}
```

### Errors

**400 Bad Request** - Battery không phải `in_use`
```json
{
  "statusCode": 400,
  "message": "Cannot simulate discharge for battery with status charging. Only batteries in_use can be discharged.",
  "error": "Bad Request"
}
```

**404 Not Found** - Battery không tồn tại
```json
{
  "statusCode": 404,
  "message": "Battery with ID 999 not found",
  "error": "Not Found"
}
```

---

## 2. Set Battery Charge

**Endpoint**: `PATCH /api/v1/batteries/set-charge`

**Mô tả**: Set `current_charge` của battery đến giá trị cụ thể (dành cho admin).

**Auth**: Required (admin)

**Điều kiện**: Không có (có thể set cho bất kỳ battery nào)

### Request Body

```typescript
{
  battery_id: number;         // Required
  charge_percentage: number;  // Required: 0-100
}
```

### Response

```json
{
  "battery_id": 1,
  "previous_charge": 50,
  "current_charge": 80,
  "change_amount": 30,
  "status": "in_use",
  "vehicle": {
    "vehicle_id": 3,
    "vin": "VIN123456",
    "user_id": 4
  },
  "station": null,
  "message": "Battery charge set to 80%"
}
```

### Example

```bash
PATCH /api/v1/batteries/set-charge
{
  "battery_id": 1,
  "charge_percentage": 80
}
```

**Use Cases**:
- Admin muốn điều chỉnh charge cho testing
- Reset battery về trạng thái cụ thể
- Debug/troubleshooting

---

## 3. Simulate Battery Charging

**Endpoint**: `POST /api/v1/batteries/simulate-charging`

**Mô tả**: Tăng `current_charge` của battery để simulate sạc pin tại trạm.

**Auth**: Required (admin/system)

**Điều kiện**: Battery phải có `status = 'charging'`

### Request Body

```typescript
{
  battery_id: number;        // Required
  increase_amount?: number;  // Optional: Tăng bao nhiêu % (0-100)
}
```

**Logic**:
- Nếu có `increase_amount` → Tăng theo số lượng cụ thể
- Nếu không có → Random tăng 10-30%
- Nếu đạt 100% → Tự động chuyển `status` sang `'full'`

### Response

```json
{
  "battery_id": 2,
  "previous_charge": 70,
  "current_charge": 95,
  "increase_amount": 25,
  "status": "charging",
  "is_full": false,
  "station": {
    "station_id": 1,
    "name": "Station A"
  },
  "message": "Battery charging: 70% → 95%"
}
```

**Response khi đạt 100%**:
```json
{
  "battery_id": 2,
  "previous_charge": 95,
  "current_charge": 100,
  "increase_amount": 5,
  "status": "full",
  "is_full": true,
  "station": {
    "station_id": 1,
    "name": "Station A"
  },
  "message": "Battery fully charged and status changed to 'full'"
}
```

### Examples

**Example 1: Random increase (10-30%)**
```bash
POST /api/v1/batteries/simulate-charging
{
  "battery_id": 2
}
```

**Example 2: Increase by specific amount**
```bash
POST /api/v1/batteries/simulate-charging
{
  "battery_id": 2,
  "increase_amount": 25
}
```

### Errors

**400 Bad Request** - Battery không phải `charging`
```json
{
  "statusCode": 400,
  "message": "Cannot charge battery with status in_use. Only batteries with status 'charging' can be charged.",
  "error": "Bad Request"
}
```

---

## 🎯 Use Cases

### Scenario 1: Giả lập driver di chuyển
1. Driver swap battery → Battery status = `in_use`, charge = 100%
2. Gọi `simulate-discharge` nhiều lần để giả lập di chuyển
3. Khi charge thấp → Driver đến trạm swap lại

```bash
# Di chuyển 50km (giảm ~15%)
POST /batteries/simulate-discharge
{ "battery_id": 1, "decrease_amount": 15 }

# Di chuyển tiếp 30km (giảm ~10%)
POST /batteries/simulate-discharge
{ "battery_id": 1, "decrease_amount": 10 }

# Charge còn 75% → Swap battery tại trạm
```

### Scenario 2: Giả lập sạc pin tại trạm
1. Battery được return về trạm → status = `charging`, charge thấp
2. Gọi `simulate-charging` để tăng charge dần
3. Khi đạt 100% → status tự động = `full`, ready để swap

```bash
# Battery vừa return, charge = 30%
POST /batteries/simulate-charging
{ "battery_id": 2, "increase_amount": 40 }
# → charge = 70%

POST /batteries/simulate-charging
{ "battery_id": 2, "increase_amount": 30 }
# → charge = 100%, status = 'full'
```

### Scenario 3: Admin testing
```bash
# Set battery về 20% để test low battery warning
PATCH /batteries/set-charge
{ "battery_id": 1, "charge_percentage": 20 }

# Set về 100% để test full battery flow
PATCH /batteries/set-charge
{ "battery_id": 1, "charge_percentage": 100 }
```

---

## 📊 Battery Status Flow

```
┌─────────┐  assign to vehicle  ┌─────────┐  discharge  ┌─────────┐
│  full   │ ──────────────────> │ in_use  │ ─────────> │ in_use  │
│ 100%    │                     │ 100%    │            │ 85% ... │
└─────────┘                     └─────────┘            └─────────┘
                                     │                       │
                                     │                       │
                                     │ return to station     │
                                     │                       │
                                     ▼                       ▼
┌─────────┐  charging done  ┌──────────┐  return battery  ┌─────────┐
│  full   │ <────────────── │ charging │ <──────────────  │ in_use  │
│ 100%    │                 │  30%...  │                  │  25%    │
└─────────┘                 └──────────┘                  └─────────┘
                                  │
                                  │ simulate-charging
                                  ▼
                            ┌──────────┐
                            │ charging │
                            │ 50%...   │
                            └──────────┘
```

---

## 🧪 Testing

Run test script:
```bash
cd backend
./test-battery-simulation.sh
```

Test script sẽ test:
- ✅ Random discharge
- ✅ Specific discharge amount
- ✅ Set to specific charge
- ✅ Admin set charge
- ✅ Random charging
- ✅ Specific charging amount
- ❌ Error: Discharge non-in_use battery
- ❌ Error: Charge non-charging battery

---

## 🔐 Security Notes

- `simulate-discharge`: Chỉ driver/admin có battery đang in_use
- `set-charge`: Chỉ admin (nên thêm role guard)
- `simulate-charging`: Chỉ admin/system (cho background jobs)

**TODO**: Thêm role-based guards để bảo vệ endpoints
