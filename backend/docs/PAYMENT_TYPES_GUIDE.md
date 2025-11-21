# Payment Type System - Hướng Dẫn Chi Tiết

## Tổng Quan

Hệ thống thanh toán VNPAY đã được mở rộng để hỗ trợ **6 loại thanh toán khác nhau** thay vì chỉ một loại. Mỗi loại thanh toán sẽ có logic xử lý riêng khi thanh toán thành công.

## 6 Loại Thanh Toán (Payment Types)

### 1. **SUBSCRIPTION** (Mặc định)
- **Mô tả**: Thanh toán gói đăng ký pin thường
- **Tình huống**: Khách hàng mua gói theo tháng (tháng 1, tháng 3, tháng 6)
- **Xử lý**: Tạo Subscription, gán vehicle_id
- **Example**:
```json
{
  "package_id": 1,
  "vehicle_id": 5,
  "payment_type": "subscription"
}
```

---

### 2. **SUBSCRIPTION_WITH_DEPOSIT** ⭐ (LẦN ĐẦU TIÊN)
- **Mô tả**: Thanh toán gói đăng ký + tiền đặt cọc pin
- **Tình huống**: Lần thanh toán đầu tiên, khách hàng mới cần:
  - Tiền gói đăng ký (ví dụ: 300,000 VNĐ)
  - Tiền đặt cọc pin (ví dụ: 500,000 VNĐ)
  - **Tổng cộng: 800,000 VNĐ**
- **Xử lý**: 
  - Tạo Subscription
  - Lưu thông tin tiền cọc vào hệ thống
  - Khác với subscription thường là cộng thêm phí cọc
- **Example**:
```json
{
  "package_id": 1,
  "vehicle_id": 5,
  "payment_type": "subscription_with_deposit"
}
```

---

### 3. **BATTERY_DEPOSIT**
- **Mô tả**: Chỉ thanh toán tiền đặt cọc pin (không mua gói)
- **Tình huống**: Khách hàng muốn nạp/bổ sung tiền cọc
- **Xử lý**: 
  - KHÔNG tạo Subscription
  - Lưu tiền cọc vào tài khoản user
  - Chỉ ghi nhận transaction
- **Example**:
```json
{
  "vehicle_id": 5,
  "payment_type": "battery_deposit"
}
```

---

### 4. **BATTERY_REPLACEMENT**
- **Mô tả**: Thanh toán thay thế pin
- **Tình huống**: Khách hàng cần thay pin bị hỏng/hết pin
- **Xử lý**: Ghi nhận transaction, cập nhật trạng thái pin
- **Example**:
```json
{
  "vehicle_id": 5,
  "payment_type": "battery_replacement"
}
```

---

### 5. **DAMAGE_FEE**
- **Mô tả**: Thanh toán phí hư hỏng pin/thiết bị
- **Tình huống**: Khách hàng gây hư hỏng, cần trả phí bồi thường
- **Xử lý**: Ghi nhận phí, đóng transaction
- **Example**:
```json
{
  "vehicle_id": 5,
  "payment_type": "damage_fee"
}
```

---

### 6. **OTHER**
- **Mô tả**: Các loại thanh toán khác
- **Tình huống**: Thanh toán hỗ trợ, phí dịch vụ khác
- **Xử lý**: Ghi nhận transaction, log thông tin

---

## Cách Sử Dụng API

### Endpoint: POST `/api/v1/payments/create-vnpay-url`

**Request Body**:
```json
{
  "package_id": 1,
  "vehicle_id": 5,
  "payment_type": "subscription_with_deposit",
  "order_info": "Thanh toán gói + tiền cọc pin"
}
```

**Response**:
```json
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentgate/...",
  "payment_id": 123,
  "vnp_txn_ref": "123145500",
  "debug_params": { ... }
}
```

---

## Mô Phỏng Thanh Toán (Mock Payment)

### Test các payment types khác nhau

```bash
# Test SUBSCRIPTION
curl -X POST http://localhost:3000/api/v1/payments/mock-payment \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "package_id": 1,
    "vehicle_id": 5,
    "payment_type": "subscription"
  }'

# Test SUBSCRIPTION_WITH_DEPOSIT
curl -X POST http://localhost:3000/api/v1/payments/mock-payment \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "package_id": 1,
    "vehicle_id": 5,
    "payment_type": "subscription_with_deposit"
  }'

# Test BATTERY_DEPOSIT
curl -X POST http://localhost:3000/api/v1/payments/mock-payment \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "vehicle_id": 5,
    "payment_type": "battery_deposit"
  }'
```

---

## Quy Trình Xử Lý Khi Thanh Toán Thành Công

```
VNPAY Return → handleVnpayReturn()
    ↓
Verify Signature & Status
    ↓
Update Payment Record (status = success)
    ↓
handleSuccessfulPayment(payment) - SWITCH CASE
    ├─ subscription → createSubscriptionFromPayment()
    ├─ subscription_with_deposit → createSubscriptionWithDeposit()
    ├─ battery_deposit → Lưu cọc vào user
    ├─ battery_replacement → Xử lý thay thế
    ├─ damage_fee → Ghi nhận phí
    └─ other → Log thông tin
    ↓
Redirect to Frontend (success/failed)
```

---

## Config Giá Tiền (Dùng Config Table)

**Các config cần thiết**:
- `Student_Initial_Deposit`: Tiền cọc sinh viên
- `Regular_Initial_Deposit`: Tiền cọc thường
- `Battery_Replacement_Fee`: Phí thay thế pin
- `Battery_Damage_Penalty`: Phí hư hỏng
- Etc...

---

## Ví Dụ Thực Tế: Lần Thanh Toán Đầu Tiên

**Tình Huống**:
Khách hàng mới đăng ký, muốn mua **Gói 3 tháng** và thanh toán lần đầu tiên.

**Bước 1**: Frontend gọi API tạo VNPAY URL
```json
{
  "package_id": 2,  // Gói 3 tháng
  "vehicle_id": 10,
  "payment_type": "subscription_with_deposit",
  "order_info": "Khách hàng mới: Gói 3 tháng + tiền cọc"
}
```

**Bước 2**: Hệ thống tính toán số tiền:
- Giá gói 3 tháng: 900,000 VNĐ
- Tiền đặt cọc (từ Config): 500,000 VNĐ
- **Tổng**: 1,400,000 VNĐ

**Bước 3**: Khách hàng thanh toán qua VNPAY

**Bước 4**: VNPAY gọi callback
- Kiểm tra chữ ký
- Cập nhật trạng thái payment = success
- **Gọi handleSuccessfulPayment()**
  - Loại: subscription_with_deposit
  - Tạo Subscription (active, 3 tháng)
  - Lưu tiền cọc vào user (có thể tạo trường `battery_deposit_balance`)

**Bước 5**: Redirect user tới trang success

---

## Lưu Ý Quan Trọng

1. **payment_type mặc định**: Nếu không chỉ định, sẽ mặc định là `subscription`
2. **payment_type phải hợp lệ**: Phải là một trong 6 loại ở trên
3. **Logic xử lý có thể mở rộng**: Thêm các case khác nếu cần
4. **Subscription chỉ tạo cho subscription & subscription_with_deposit**: Các loại khác không tạo subscription

---

## TODO Tương Lai

- [ ] Thêm `battery_deposit_balance` vào User model
- [ ] Thêm table `BatteryDeposit` để lưu lịch sử nạp cọc
- [ ] Tách tiền cọc từ gói subscription một cách rõ ràng
- [ ] Thêm logic trừ cọc khi giao dịch
- [ ] Hoàn trả cọc khi cancel subscription
