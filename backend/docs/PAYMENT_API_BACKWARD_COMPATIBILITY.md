# Payment API - Backward Compatibility Guide

**Ngày**: 31/10/2025  
**Mục đích**: Giữ nguyên API cũ, thêm endpoint mới cho payment types

---

## 📊 API Endpoints Overview

### ✅ OLD ENDPOINTS (Backward Compatible)

| Endpoint | Method | Mô Tả | payment_type |
|---|---|---|---|
| `/api/v1/payments/create-vnpay-url` | POST | Tạo URL thanh toán (cũ) | `subscription` (cố định) |
| `/api/v1/payments/vnpay-return` | GET | Callback từ VNPAY | Tự động |
| `/api/v1/payments/vnpay-ipn` | GET | IPN từ VNPAY | Tự động |
| `/api/v1/payments/mock-payment` | POST | Test thanh toán | Linh hoạt |
| `/api/v1/payments/:id` | GET | Lấy thông tin thanh toán | - |
| `/api/v1/payments/user/:userId` | GET | Lịch sử thanh toán | - |
| `/api/v1/payments` | GET | Tất cả thanh toán (admin) | - |

### ⭐ NEW ENDPOINTS (Advanced Payment Types)

| Endpoint | Method | Mô Tả | payment_type |
|---|---|---|---|
| `/api/v1/payments/create-vnpay-url-advanced` | POST | Tạo URL với payment_type linh hoạt | Tùy chọn |
| `/api/v1/payments/battery-deposit` | POST | Nạp tiền cọc pin | `battery_deposit` |
| `/api/v1/payments/damage-fee` | POST | Thanh toán phí hư hỏng | `damage_fee` |
| `/api/v1/payments/battery-replacement` | POST | Thanh toán thay thế pin | `battery_replacement` |

---

## 🔄 So Sánh: Cũ vs Mới

### Cách 1: API CŨ (Giữ nguyên)
```bash
# ✅ Vẫn hoạt động - payment_type sẽ tự động được set = 'subscription'
curl -X POST http://localhost:3000/api/v1/payments/create-vnpay-url \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "package_id": 2,
    "vehicle_id": 5
  }'
```

### Cách 2: API MỚI - Advanced (payment_type = subscription)
```bash
# ⭐ Giống cách 1, nhưng rõ ràng hơn về payment_type
curl -X POST http://localhost:3000/api/v1/payments/create-vnpay-url-advanced \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "package_id": 2,
    "vehicle_id": 5,
    "payment_type": "subscription"
  }'
```

### Cách 3: API MỚI - Subscription + Deposit (LẦN ĐẦU)
```bash
# ⭐ Khách hàng mới: thanh toán gói + tiền cọc
curl -X POST http://localhost:3000/api/v1/payments/create-vnpay-url-advanced \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "package_id": 2,
    "vehicle_id": 5,
    "payment_type": "subscription_with_deposit"
  }'
```

### Cách 4: API MỚI - Nạp Tiền Cọc (Không Mua Gói)
```bash
# ⭐ Endpoint chuyên dụng: nạp tiền cọc pin
curl -X POST http://localhost:3000/api/v1/payments/battery-deposit \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "amount": 500000,
    "vehicle_id": 5
  }'
```

### Cách 5: API MỚI - Thanh Toán Phí Hư Hỏng
```bash
# ⭐ Endpoint chuyên dụng: thanh toán phí hư hỏng
curl -X POST http://localhost:3000/api/v1/payments/damage-fee \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "amount": 100000,
    "vehicle_id": 5,
    "description": "Hư hỏng pin - cần bồi thường"
  }'
```

### Cách 6: API MỚI - Thay Thế Pin
```bash
# ⭐ Endpoint chuyên dụng: thanh toán thay thế pin
curl -X POST http://localhost:3000/api/v1/payments/battery-replacement \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "amount": 150000,
    "vehicle_id": 5,
    "description": "Thay thế pin bị hỏng"
  }'
```

---

## 💡 Khi Nào Dùng API Nào?

### 1. **CREATE-VNPAY-URL** (API Cũ)
✅ **Sử dụng khi**:
- Chỉ thanh toán gói đăng ký
- Không cần quan tâm đến payment_type
- Muốn giữ nguyên code cũ

```typescript
// Frontend cũ vẫn hoạt động
createVnpayUrl({
  user_id: 1,
  package_id: 2,
  vehicle_id: 5
})
```

---

### 2. **CREATE-VNPAY-URL-ADVANCED** (API Mới - Tổng Quát)
✅ **Sử dụng khi**:
- Cần hỗ trợ nhiều payment_type
- Có gói đăng ký + tiền cọc
- Linh hoạt và có control

```typescript
// Frontend mới - có thể chọn payment_type
createVnpayUrlAdvanced({
  user_id: 1,
  package_id: 2,
  vehicle_id: 5,
  payment_type: 'subscription_with_deposit'
})
```

---

### 3. **BATTERY-DEPOSIT** (API Mới - Chuyên Dụng)
✅ **Sử dụng khi**:
- Khách hàng chỉ muốn nạp tiền cọc
- Không mua gói
- Simple & rõ ràng

```typescript
// Nạp cọc pin đơn giản
createBatteryDeposit({
  user_id: 1,
  amount: 500000,
  vehicle_id: 5
})
```

---

### 4. **DAMAGE-FEE** (API Mới - Chuyên Dụng)
✅ **Sử dụng khi**:
- Khách hàng gây hư hỏng
- Cần thanh toán phí bồi thường
- Không liên quan đến gói

```typescript
// Thanh toán phí hư hỏng
createDamageFee({
  user_id: 1,
  amount: 100000,
  vehicle_id: 5,
  description: 'Hư hỏng pin'
})
```

---

### 5. **BATTERY-REPLACEMENT** (API Mới - Chuyên Dụng)
✅ **Sử dụng khi**:
- Khách hàng cần thay thế pin
- Pin đã hỏng/hết pin
- Logic riêng biệt

```typescript
// Thanh toán thay thế pin
createBatteryReplacement({
  user_id: 1,
  amount: 150000,
  vehicle_id: 5,
  description: 'Thay thế pin bị hỏng'
})
```

---

## 📐 Flow So Sánh

### API Cũ - CREATE-VNPAY-URL
```
Request (package_id, vehicle_id)
    ↓
Validate package
    ↓
Calculate amount = package.base_price
    ↓
Create Payment (payment_type = 'subscription')
    ↓
Generate VNPAY URL
    ↓
Return paymentUrl
```

### API Mới - BATTERY-DEPOSIT
```
Request (user_id, amount, vehicle_id)
    ↓
Set amount directly (không từ package)
    ↓
Create Payment (payment_type = 'battery_deposit')
    ↓
Generate VNPAY URL
    ↓
Return paymentUrl
    ↓
After payment: Lưu cọc vào user
```

---

## ⚠️ Migration Guide (Nếu Update Code Cũ)

### Hiện Tại (Cách 1)
```typescript
// Frontend cũ
this.http.post('/api/v1/payments/create-vnpay-url', {
  user_id: 1,
  package_id: 2,
  vehicle_id: 5
})
```

### Update (Cách 2) - Optional
```typescript
// Frontend cũ vẫn hoạt động, nhưng có thể update
this.http.post('/api/v1/payments/create-vnpay-url-advanced', {
  user_id: 1,
  package_id: 2,
  vehicle_id: 5,
  payment_type: 'subscription'  // Rõ ràng
})
```

### Cách 3 - Thêm Hỗ Trợ Cọc
```typescript
// Lần đầu tiên: gói + cọc
if (isFirstTime) {
  this.http.post('/api/v1/payments/create-vnpay-url-advanced', {
    user_id: 1,
    package_id: 2,
    vehicle_id: 5,
    payment_type: 'subscription_with_deposit'
  })
}

// Lần sau: chỉ gói
else {
  this.http.post('/api/v1/payments/create-vnpay-url', {
    user_id: 1,
    package_id: 2,
    vehicle_id: 5
  })
}
```

---

## 🔐 Authorization

Tất cả endpoints thanh toán đều require:
- ✅ **Guard**: `AuthGuard` + `RolesGuard`
- ✅ **Role**: `driver` hoặc `admin`

---

## 📝 Request/Response Examples

### Battery Deposit Success
**Request**:
```json
{
  "user_id": 1,
  "amount": 500000,
  "vehicle_id": 5
}
```

**Response**:
```json
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentgate/...",
  "payment_id": 456,
  "vnp_txn_ref": "310516300"
}
```

### Damage Fee Success
**Request**:
```json
{
  "user_id": 1,
  "amount": 100000,
  "vehicle_id": 5,
  "description": "Hư hỏng pin - cần bồi thường"
}
```

**Response**:
```json
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentgate/...",
  "payment_id": 457,
  "vnp_txn_ref": "310516301"
}
```

---

## 🎯 Summary

| Scenario | API Endpoint | Status |
|---|---|---|
| Mua gói (cũ) | `create-vnpay-url` | ✅ Hoạt động |
| Mua gói (mới) | `create-vnpay-url-advanced` | ✅ Hoạt động |
| Gói + cọc | `create-vnpay-url-advanced` | ✅ Hoạt động |
| Chỉ cọc | `battery-deposit` | ✅ Hoạt động |
| Phí hư hỏng | `damage-fee` | ✅ Hoạt động |
| Thay thế | `battery-replacement` | ✅ Hoạt động |

**Kết luận**: ✅ Backward compatible 100% - code cũ vẫn hoạt động, code mới có thêm tính năng!
