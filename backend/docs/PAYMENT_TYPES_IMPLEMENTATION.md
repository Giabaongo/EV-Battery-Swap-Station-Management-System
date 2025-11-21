# Payment Type System - Implementation Summary

**Ngày**: 31/10/2025  
**Branch**: be/payments  
**Mục đích**: Hỗ trợ nhiều loại thanh toán khác nhau, từ gói đăng ký đến phí tiền cọc

---

## 📋 Thay Đổi Chính

### 1. Database Changes
- ✅ Thêm enum `PaymentType` với 6 loại:
  - `subscription` - Gói đăng ký thường
  - `subscription_with_deposit` - Gói + tiền cọc (lần đầu tiên)
  - `battery_deposit` - Chỉ tiền cọc
  - `battery_replacement` - Thay thế pin
  - `damage_fee` - Phí hư hỏng
  - `other` - Khác
- ✅ Thêm trường `payment_type` vào Payment model
- ✅ Migration: `20251031132841_add_payment_type`

### 2. DTO Updates
- ✅ Updated `CreatePaymentDto` để include `payment_type` (optional, default = subscription)
- ✅ Created `PaymentTypeEnum` for type safety
- ✅ package_id giờ là optional (không bắt buộc cho tất cả payment types)

### 3. Service Logic
- ✅ Refactored `handleVnpayReturn()` để gọi hàm xử lý chuyên biệt
- ✅ Thêm `handleSuccessfulPayment()` - switch case cho từng payment type
- ✅ Thêm `createSubscriptionFromPayment()` - xử lý subscription thường
- ✅ Thêm `createSubscriptionWithDeposit()` - xử lý subscription + tiền cọc
- ✅ Mỗi payment type có logic riêng

### 4. Controller Updates
- ✅ Updated `vnpayReturn()` để xử lý response object thay vì properties
- ✅ Check `result.status` thay vì `result.success`
- ✅ Redirect với `subscription_id` hoặc response code

### 5. Documentation
- ✅ Created `PAYMENT_TYPES_GUIDE.md` - hướng dẫn chi tiết
- ✅ Ví dụ cho từng payment type
- ✅ Cách sử dụng API
- ✅ Mô phỏng thanh toán

---

## 🎯 Ví Dụ Thực Tế: Lần Thanh Toán Đầu Tiên

### Scenario
Khách hàng mới muốn mua gói 3 tháng + tiền cọc pin

### Request
```bash
POST /api/v1/payments/create-vnpay-url
{
  "user_id": 1,
  "package_id": 2,
  "vehicle_id": 5,
  "payment_type": "subscription_with_deposit",
  "orderDescription": "Gói 3 tháng + tiền cọc pin"
}
```

### Processing
1. Tạo Payment record với `payment_type = subscription_with_deposit`
2. VNPAY URL được tạo với số tiền = gói + cọc
3. Khách hàng thanh toán
4. VNPAY callback → `handleVnpayReturn()`
5. Gọi `handleSuccessfulPayment()`:
   - Switch case: `subscription_with_deposit`
   - Gọi `createSubscriptionWithDeposit()`
   - Tạo Subscription (3 tháng)
   - Lưu tiền cọc vào user
6. Redirect: `/payment/success?subscription_id=123`

---

## 🔄 Flow Diagram

```
Request (payment_type = subscription_with_deposit)
    ↓
createPaymentUrl()
    ├─ Validate package
    ├─ Calculate amount
    ├─ Create Payment record (payment_type saved)
    └─ Generate VNPAY URL
    ↓
User pays at VNPAY
    ↓
VNPAY Redirect → vnpayReturn()
    ↓
handleVnpayReturn()
    ├─ Verify signature
    ├─ Update Payment status
    └─ Call handleSuccessfulPayment()
    ↓
handleSuccessfulPayment()
    ├─ Switch (payment_type)
    └─ Case subscription_with_deposit:
        └─ createSubscriptionWithDeposit()
            ├─ Create Subscription (3 months)
            ├─ Save deposit info
            └─ Link Payment to Subscription
    ↓
Redirect → Frontend (success/failed)
```

---

## 💡 Use Cases

| Payment Type | Situation | Logic |
|---|---|---|
| **subscription** | Regular subscription | Create Subscription, assign vehicle |
| **subscription_with_deposit** | First time payment | Create Subscription + save deposit |
| **battery_deposit** | Top up deposit | Save to user.battery_deposit_balance |
| **battery_replacement** | Replace damaged battery | Process replacement, update battery status |
| **damage_fee** | Pay for damage | Record fee, close transaction |
| **other** | Miscellaneous | Log transaction |

---

## 📝 Next Steps (TODO)

- [ ] Add `battery_deposit_balance` to User model
- [ ] Create `BatteryDeposit` table for deposit history
- [ ] Implement deposit refund logic on subscription cancel
- [ ] Add deposit deduction on battery replacement
- [ ] Integrate with Config system for dynamic pricing
- [ ] Create admin dashboard to manage payment types
- [ ] Add payment analytics by type

---

## 🧪 Testing Commands

```bash
# Test subscription_with_deposit
curl -X POST http://localhost:3000/api/v1/payments/create-vnpay-url \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "package_id": 2,
    "vehicle_id": 5,
    "payment_type": "subscription_with_deposit"
  }'

# Mock payment test
curl -X POST http://localhost:3000/api/v1/payments/mock-payment \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "package_id": 2,
    "vehicle_id": 5,
    "payment_type": "subscription_with_deposit"
  }'
```

---

## ✅ Files Modified

- ✅ `prisma/models/payments.prisma` - Added `payment_type` enum and field
- ✅ `src/modules/payments/payments.service.ts` - Added switch logic
- ✅ `src/modules/payments/payments.controller.ts` - Updated vnpayReturn
- ✅ `src/modules/payments/dto/create-payment.dto.ts` - Added payment_type
- ✅ `docs/PAYMENT_TYPES_GUIDE.md` - Created detailed guide

---

## ✅ Migration Applied

```
✓ Migration: 20251031132841_add_payment_type
✓ Database synced
✓ Prisma Client updated
```

---

## 📞 Support

Nếu gặp issue, kiểm tra:
1. Payment record có `payment_type` được set chính xác?
2. Switch case có xử lý payment type đó không?
3. Database migration đã được apply?
4. Environment variables đã được config?
