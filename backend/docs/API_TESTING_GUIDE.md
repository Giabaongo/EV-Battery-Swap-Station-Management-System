# 🧪 API Testing Guide - Fee Calculation & Package System

**Base URL:** `http://localhost:8080`

---

## 📋 Table of Contents
1. [Authentication](#authentication)
2. [Fee Calculation Endpoints](#fee-calculation-endpoints)
3. [Test Scenarios](#test-scenarios)
4. [Postman Collection](#postman-collection)
5. [cURL Examples](#curl-examples)

---

## 🔐 Authentication

Tất cả endpoints require **JWT token**. Cần login trước để lấy token.

### 1️⃣ Login để lấy Access Token

**POST** `/auth/login`

```json
{
  "email": "driver@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "...",
  "user": {
    "user_id": 1,
    "email": "driver@example.com",
    "role": "driver"
  }
}
```

**Lưu `access_token` để dùng cho các requests sau.**

---

## 💰 Fee Calculation Endpoints

### Endpoint 1: Calculate Subscription + Deposit Fee

**POST** `/payments/calculate/subscription-fee`

**Description:** Tính phí đăng ký gói + phí cọc pin (400,000 VNĐ)

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "packageId": 1
}
```

**Response:**
```json
{
  "subscription_fee": 50000,
  "deposit_fee": 400000,
  "overcharge_fee": 0,
  "damage_fee": 0,
  "total_fee": 450000,
  "breakdown": {
    "package_price": 50000,
    "deposit_amount": 400000,
    "overcharge_km": 0,
    "overcharge_cost": 0,
    "damage_cost": 0
  },
  "breakdown_text": "📦 Phí đăng ký gói: 50.000 VNĐ\n💰 Phí cọc pin: 400.000 VNĐ\n\n💳 TỔNG CỘNG: 450.000 VNĐ"
}
```

---

### Endpoint 2: Calculate Overcharge Fee (Km Vượt Quá)

**POST** `/payments/calculate/overcharge-fee`

**Description:** Tính phí vượt km - áp dụng tiering như tiền điện (3 bậc)

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "subscriptionId": 1,
  "actualDistanceTraveled": 4500
}
```

**Response (Example: 4500km traveled):**
```json
{
  "subscription_fee": 0,
  "deposit_fee": 0,
  "overcharge_fee": 908500,
  "damage_fee": 0,
  "total_fee": 908500,
  "breakdown": {
    "package_price": 0,
    "deposit_amount": 0,
    "overcharge_km": 500,
    "overcharge_cost": 908500,
    "damage_cost": 0
  },
  "breakdown_text": "🔋 Phí vượt km: 500km × giá tiering = 908.500 VNĐ\n\n💳 TỔNG CỘNG: 908.500 VNĐ"
}
```

**💡 Tiering System:**
- **Tier 1** (0-2000km vượt): 216 VNĐ/km
- **Tier 2** (2001-4000km vượt): 195 VNĐ/km  
- **Tier 3** (4000km+ vượt): 173 VNĐ/km

**💻 Ví dụ tính toán:**
```
Quãng đường cơ bản: 4000km
Quãng đường thực tế: 4500km
Vượt quá: 500km

Phí = 500km × 173 VNĐ/km = 86.500 VNĐ
```

---

### Endpoint 3: Calculate Damage Fee

**POST** `/payments/calculate/damage-fee`

**Description:** Tính phí hư hỏng theo mức độ

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "damageSeverity": "moderate"
}
```

**Severity Options:**
- `"minor"` → 10,000 VNĐ (Hư hỏng nhẹ)
- `"moderate"` → 50,000 VNĐ (Hư hỏng trung bình)
- `"severe"` → 100,000 VNĐ (Mất tích thiết bị)

**Response (Example: moderate):**
```json
{
  "subscription_fee": 0,
  "deposit_fee": 0,
  "overcharge_fee": 0,
  "damage_fee": 50000,
  "total_fee": 50000,
  "breakdown": {
    "package_price": 0,
    "deposit_amount": 0,
    "overcharge_km": 0,
    "overcharge_cost": 0,
    "damage_cost": 50000
  },
  "breakdown_text": "🔨 Phí hư hỏng: 50.000 VNĐ\n\n💳 TỔNG CỘNG: 50.000 VNĐ"
}
```

---

### Endpoint 4: Calculate Complex Fee (Multiple Types)

**POST** `/payments/calculate/complex-fee`

**Description:** Tính tổng phí khi khách hàng lần đầu tiên + vượt km + hư hỏng

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body (Example: All fees combined):**
```json
{
  "packageId": 1,
  "subscriptionId": 1,
  "actualDistanceTraveled": 4500,
  "damageSeverity": "moderate"
}
```

**Response:**
```json
{
  "subscription_fee": 50000,
  "deposit_fee": 400000,
  "overcharge_fee": 86500,
  "damage_fee": 50000,
  "total_fee": 586500,
  "breakdown": {
    "package_price": 50000,
    "deposit_amount": 400000,
    "overcharge_km": 500,
    "overcharge_cost": 86500,
    "damage_cost": 50000
  },
  "breakdown_text": "📦 Phí đăng ký gói: 50.000 VNĐ\n💰 Phí cọc pin: 400.000 VNĐ\n🔋 Phí vượt km: 500km × giá tiering = 86.500 VNĐ\n🔨 Phí hư hỏng: 50.000 VNĐ\n\n💳 TỔNG CỘNG: 586.500 VNĐ"
}
```

---

## 🧪 Test Scenarios

### Scenario 1: Khách hàng mới đăng ký gói (Subscription + Deposit)

```bash
# Step 1: Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "password": "password123"
  }'

# Step 2: Tính phí đăng ký + cọc
# Dùng access_token từ Step 1
curl -X POST http://localhost:8080/payments/calculate/subscription-fee \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": 1
  }'
```

**Expected Result:**
- Phí đăng ký: giá gói
- Phí cọc: 400,000 VNĐ (fixed)
- Tổng: > 400,000 VNĐ

---

### Scenario 2: Khách hàng vượt quá quãng đường

```bash
# Tính phí vượt km với 3 bậc tiering
curl -X POST http://localhost:8080/payments/calculate/overcharge-fee \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": 1,
    "actualDistanceTraveled": 2500
  }'
```

**Phép tính:**
- Base distance: 4000km
- Actual distance: 2500km
- Overcharge: 0km (còn nằm trong base distance)
- **Kết quả: 0 VNĐ**

---

### Scenario 3: Pin bị hư hỏng

```bash
# Tính phí hư hỏng mức độ cao (severe)
curl -X POST http://localhost:8080/payments/calculate/damage-fee \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "damageSeverity": "severe"
  }'
```

**Expected Result:** 100,000 VNĐ

---

### Scenario 4: Khách hàng tính tất cả phí

```bash
# Tính toàn bộ phí: đăng ký + cọc + vượt km + hư hỏng
curl -X POST http://localhost:8080/payments/calculate/complex-fee \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": 1,
    "subscriptionId": 1,
    "actualDistanceTraveled": 5500,
    "damageSeverity": "moderate"
  }'
```

**Phép tính:**
- Phí đăng ký: 50,000 VNĐ
- Phí cọc: 400,000 VNĐ
- Quãng đường vượt: 1500km (5500 - 4000)
  - 1500km × 195 VNĐ/km (Tier 2) = 292,500 VNĐ
- Phí hư hỏng: 50,000 VNĐ (moderate)
- **Tổng: 792,500 VNĐ**

---

## 📮 Postman Collection

### Import vào Postman

Tạo 1 collection mới với 4 requests:

**1. Login**
- Method: POST
- URL: `{{base_url}}/auth/login`
- Body:
```json
{
  "email": "driver@example.com",
  "password": "password123"
}
```
- Tests tab:
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("access_token", jsonData.access_token);
    pm.environment.set("subscriptionId", 1);
}
```

**2. Calculate Subscription Fee**
- Method: POST
- URL: `{{base_url}}/payments/calculate/subscription-fee`
- Headers: `Authorization: Bearer {{access_token}}`
- Body:
```json
{
  "packageId": 1
}
```

**3. Calculate Overcharge Fee**
- Method: POST
- URL: `{{base_url}}/payments/calculate/overcharge-fee`
- Headers: `Authorization: Bearer {{access_token}}`
- Body:
```json
{
  "subscriptionId": 1,
  "actualDistanceTraveled": 4500
}
```

**4. Calculate Damage Fee**
- Method: POST
- URL: `{{base_url}}/payments/calculate/damage-fee`
- Headers: `Authorization: Bearer {{access_token}}`
- Body:
```json
{
  "damageSeverity": "moderate"
}
```

**5. Calculate Complex Fee**
- Method: POST
- URL: `{{base_url}}/payments/calculate/complex-fee`
- Headers: `Authorization: Bearer {{access_token}}`
- Body:
```json
{
  "packageId": 1,
  "subscriptionId": 1,
  "actualDistanceTraveled": 5500,
  "damageSeverity": "moderate"
}
```

---

## 🔧 cURL Examples

### Test 1: Đăng ký + Cọc

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "password": "password123"
  }' | jq -r '.access_token')

curl -X POST http://localhost:8080/payments/calculate/subscription-fee \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": 1
  }' | jq .
```

### Test 2: Vượt km - Tier 1 (0-2000km)

```bash
curl -X POST http://localhost:8080/payments/calculate/overcharge-fee \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": 1,
    "actualDistanceTraveled": 4500
  }' | jq .
```

**Expected:** 500km × 216 VNĐ/km = 108,000 VNĐ (nếu base là 4000km và tier 1)

### Test 3: Vượt km - Tier 2 (2001-4000km)

```bash
curl -X POST http://localhost:8080/payments/calculate/overcharge-fee \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": 1,
    "actualDistanceTraveled": 6500
  }' | jq .
```

**Expected:** 
- Tier 1: 2000km × 216 = 432,000 VNĐ
- Tier 2: 500km × 195 = 97,500 VNĐ
- **Total: 529,500 VNĐ**

### Test 4: Vượt km - Tier 3 (4000km+)

```bash
curl -X POST http://localhost:8080/payments/calculate/overcharge-fee \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": 1,
    "actualDistanceTraveled": 8500
  }' | jq .
```

**Expected:**
- Tier 1: 2000km × 216 = 432,000 VNĐ
- Tier 2: 2000km × 195 = 390,000 VNĐ
- Tier 3: 500km × 173 = 86,500 VNĐ
- **Total: 908,500 VNĐ**

### Test 5: Hư hỏng - Minor

```bash
curl -X POST http://localhost:8080/payments/calculate/damage-fee \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "damageSeverity": "minor"
  }' | jq .
```

**Expected:** 10,000 VNĐ

### Test 6: Hư hỏng - Severe

```bash
curl -X POST http://localhost:8080/payments/calculate/damage-fee \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "damageSeverity": "severe"
  }' | jq .
```

**Expected:** 100,000 VNĐ

### Test 7: Complex - Toàn bộ phí

```bash
curl -X POST http://localhost:8080/payments/calculate/complex-fee \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": 1,
    "subscriptionId": 1,
    "actualDistanceTraveled": 8500,
    "damageSeverity": "severe"
  }' | jq .
```

---

## ✅ Validation Checklist

Khi test, hãy kiểm tra:

- [ ] Token được lưu và gửi đúng trong Authorization header
- [ ] Response status code = 200
- [ ] Response có đủ 4 fields: `subscription_fee`, `deposit_fee`, `overcharge_fee`, `damage_fee`
- [ ] `total_fee` = tổng của 4 fields trên
- [ ] `breakdown_text` có text tiếng Việt hợp lệ
- [ ] Tier calculation đúng cho overcharge fee
- [ ] Deposit fee luôn = 400,000 VNĐ
- [ ] Damage fee match với severity selected

---

## 🐛 Troubleshooting

### Error 401 Unauthorized
**Nguyên nhân:** Token hết hạn hoặc không được gửi
**Cách fix:**
- Login lại để lấy token mới
- Kiểm tra Authorization header: `Bearer {token}`

### Error 404 Not Found
**Nguyên nhân:** Endpoint URL sai
**Cách fix:**
- Kiểm tra URL đúng hay không
- Base URL: `http://localhost:8080`
- Path: `/payments/calculate/{endpoint}`

### Error 422 Unprocessable Entity
**Nguyên nhân:** Request body không hợp lệ
**Cách fix:**
- Kiểm tra JSON format
- Kiểm tra field names đúng
- Kiểm tra data types: `packageId` phải là number

### Error 404 Package/Subscription Not Found
**Nguyên nhân:** ID không tồn tại trong database
**Cách fix:**
- Lấy ID từ database thực tế
- Hoặc dùng Prisma Studio: `npx prisma studio`

---

## 📊 Database Structure

### BatteryServicePackage
```sql
SELECT * FROM battery_service_packages;
```

Columns:
- `package_id` - ID gói
- `name` - Tên gói (e.g., "Gói Pin 2")
- `battery_count` - Số lượng pin (e.g., 2)
- `base_distance` - Quãng đường cơ bản (e.g., 4000km)
- `base_price` - Giá gói (e.g., 50000 VNĐ)
- `swap_count` - Số lần swap
- `penalty_fee` - Phí phạt
- `duration_days` - (Deprecated, kept for compatibility)

### Config
```sql
SELECT * FROM configs WHERE type = 'deposit' OR type = 'penalty';
```

Key configs:
- `Battery_Deposit_Default` = 400,000 VNĐ
- `Overcharge_Fee_Tier1` = 216 VNĐ/km
- `Overcharge_Fee_Tier2` = 195 VNĐ/km
- `Overcharge_Fee_Tier3` = 173 VNĐ/km
- `Minor_Damage_Fee` = 10,000 VNĐ
- `Battery_Damage_Penalty` = 50,000 VNĐ
- `Equipment_Loss_Penalty` = 100,000 VNĐ

---

## 🎯 Quick Start

```bash
# 1. Lấy token
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "driver@example.com", "password": "password123"}' \
  | jq -r '.access_token')

echo "Token: $TOKEN"

# 2. Test subscription fee
curl -X POST http://localhost:8080/payments/calculate/subscription-fee \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"packageId": 1}' | jq .

# 3. Test overcharge fee
curl -X POST http://localhost:8080/payments/calculate/overcharge-fee \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subscriptionId": 1, "actualDistanceTraveled": 5500}' | jq .

# 4. Test damage fee
curl -X POST http://localhost:8080/payments/calculate/damage-fee \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"damageSeverity": "moderate"}' | jq .

# 5. Test complex fee
curl -X POST http://localhost:8080/payments/calculate/complex-fee \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"packageId": 1, "subscriptionId": 1, "actualDistanceTraveled": 5500, "damageSeverity": "moderate"}' | jq .
```

---

## 📝 Notes

- **Phí cọc pin:** Luôn = **400,000 VNĐ** (không thay đổi)
- **Phí vượt km:** Dùng tiering system 3 bậc, như tiền điện
- **Phí hư hỏng:** 3 mức (minor/moderate/severe)
- **Phí đăng ký:** Lấy từ `base_price` của gói
- Tất cả phí tính bằng **VNĐ** (Việt Nam Đồng)

---

**Updated:** October 31, 2025
**Version:** 1.0
**Status:** ✅ Ready for Testing
