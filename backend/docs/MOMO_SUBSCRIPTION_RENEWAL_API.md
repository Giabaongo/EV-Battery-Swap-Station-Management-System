# MoMo Subscription Renewal Payment API

## 🎯 Tổng quan

API mới để gia hạn subscription đã hết hạn và thanh toán phí phạt vượt km qua MoMo.

## 📍 Endpoint

```
POST /api/v1/payments/momo-subscription-renewal
```

## 🔐 Authentication

- **Required**: Bearer token
- **Roles**: `driver`, `admin`

## 📥 Request Body

```json
{
  "subscription_id": 1
}
```

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| subscription_id | number | ✅ Yes | ID của subscription đã hết hạn cần gia hạn |

## 📤 Response

### Success Response (201)

```json
{
  "payment_id": 123,
  "paymentUrl": "https://test-payment.momo.vn/v2/gateway/pay?t=MOMO_RENEWAL_20250121123456",
  "vnp_txn_ref": "MOMO_RENEWAL_20250121123456",
  "feeBreakdown": {
    "baseAmount": 200000,
    "depositFee": 0,
    "overchargeFee": 0,
    "damageFee": 50000,
    "totalAmount": 250000,
    "breakdown_text": "Goi: 200.000 VND, Phat: 50.000 VND, Tong: 250.000 VND"
  },
  "paymentInfo": {
    "user_id": 7,
    "package_id": 1,
    "vehicle_id": 6,
    "payment_type": "subscription",
    "status": "pending",
    "created_at": "2025-01-21T12:34:56.000Z"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| payment_id | number | ID của payment record trong database |
| paymentUrl | string | URL để mở trang thanh toán MoMo |
| vnp_txn_ref | string | Transaction reference ID (same as MoMo orderId) |
| feeBreakdown | object | Chi tiết các khoản phí |
| feeBreakdown.baseAmount | number | Giá gốc của gói (VNĐ) |
| feeBreakdown.depositFee | number | Phí đặt cọc (luôn = 0 cho renewal) |
| feeBreakdown.overchargeFee | number | Phí vượt quá (luôn = 0) |
| feeBreakdown.damageFee | number | Phí phạt vượt km (VNĐ) |
| feeBreakdown.totalAmount | number | Tổng số tiền cần thanh toán (VNĐ) |
| feeBreakdown.breakdown_text | string | Mô tả chi tiết các khoản phí |
| paymentInfo | object | Thông tin payment |

### Error Responses

**400 Bad Request** - Subscription không thể gia hạn
```json
{
  "statusCode": 400,
  "message": "Only expired subscriptions can be renewed",
  "error": "Bad Request"
}
```

**404 Not Found** - Không tìm thấy subscription
```json
{
  "statusCode": 404,
  "message": "Subscription not found",
  "error": "Not Found"
}
```

## 💡 Cách hoạt động

### 1. Tính phí phạt tự động

- API tự động tính phí phạt vượt km từ subscription cũ
- Phí phạt = (Km đã chạy - Km giới hạn) × Giá mỗi km
- Nếu không vượt km → Phí phạt = 0

### 2. Tính tổng tiền

```
Tổng tiền = Giá gói mới + Phí phạt vượt km
```

### 3. Tạo payment record

- Status: `pending`
- Method: `momo`
- Payment type: `subscription`
- Order info: `Gia han goi [Tên gói] + phat` (nếu có phí phạt)

### 4. Tạo MoMo payment URL

- Signature: HMAC SHA256
- Request type: `payWithMethod` (trang chọn phương thức thanh toán)
- Extra data: Chứa thông tin payment_id, user_id, package_id, vehicle_id, is_renewal

**Lưu ý:** API sử dụng `payWithMethod` thay vì `captureWallet`, cho phép user chọn:
- Thanh toán bằng thẻ ATM/Visa/Mastercard
- Thanh toán qua ví MoMo
- Thanh toán bằng QR code

### 5. Xử lý sau thanh toán

Sau khi user thanh toán thành công qua MoMo:
1. MoMo redirect về `/payments/momo-return`
2. Backend verify signature
3. Cập nhật payment status → `success`
4. **Detect renewal payment** từ `order_info` (chứa "Gia han goi")
5. Tạo subscription mới:
   - Start date: Ngày hiện tại
   - End date: Start date + duration_days
   - Status: `active`
   - Swap used: 0
   - Distance traveled: 0
   - Deposit_paid: Copy từ subscription cũ
6. Link payment với subscription mới
7. Mark subscription cũ là `cancelled`
8. Redirect user về frontend

**Lưu ý:** Backend tự động nhận diện renewal payment dựa trên `order_info` chứa "Gia han goi" hoặc "gia han", không cần `payment_type` riêng.

## 🧪 Cách test

### Test với Mock Mode

Trong file `.env`, set:
```env
MOMO_USE_MOCK=true
```

Khi đó API sẽ trả về fake payment URL và không gọi MoMo API thật.

### Test với MoMo thật

1. **Tạo expired subscription** (hoặc dùng subscription đã có):

```bash
# Get subscription và check status
GET http://localhost:8080/api/v1/subscriptions/:id
```

2. **Gọi API renewal**:

```bash
POST http://localhost:8080/api/v1/payments/momo-subscription-renewal
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "subscription_id": 1
}
```

3. **Nhận response** với `payUrl`

4. **Mở `payUrl`** trong browser hoặc app MoMo

5. **Thanh toán** trên MoMo

6. **MoMo redirect** về `/momo-return`

7. **Check payment & subscription**:

```bash
# Check payment status
GET http://localhost:8080/api/v1/payments/:payment_id

# Check new subscription created
GET http://localhost:8080/api/v1/subscriptions/user/:user_id
```

## 📋 Use Cases

### Case 1: Gia hạn subscription hết hạn (không vượt km)

**Luồng:**
1. User click "Gia hạn gói"
2. Frontend gọi API renewal
3. Backend tính phí: 200.000 VNĐ (không có phí phạt)
4. MoMo mở **trang chọn phương thức thanh toán**:
   - Thanh toán bằng thẻ ATM/Visa/Mastercard
   - Thanh toán qua ví MoMo  
   - Thanh toán bằng QR code
5. User chọn phương thức và thanh toán
6. MoMo redirect về backend → Tạo subscription mới

```json
// Response
{
  "totalAmount": 200000,
  "feeBreakdown": {
    "baseAmount": 200000,
    "damageFee": 0,
    "breakdown_text": "Goi: 200.000 VND, Phat: 0 VND, Tong: 200.000 VND"
  }
}
```

### Case 2: Gia hạn subscription hết hạn (có vượt km)

**Luồng:**
1. User có subscription hết hạn, vượt 50 km
2. Frontend gọi API renewal
3. Backend tính phí phạt tự động: 50.000 VNĐ
4. Tổng tiền = 200.000 + 50.000 = 250.000 VNĐ
5. MoMo mở **trang chọn phương thức thanh toán**
6. User chọn thanh toán bằng thẻ Visa
7. Thanh toán thành công → Backend tạo subscription mới

Giả sử:
- Gói: 200.000 VNĐ, 500 km
- User đã chạy: 550 km
- Vượt: 50 km
- Phí phạt: 50 × 1000 = 50.000 VNĐ

```json
// Request
{
  "subscription_id": 1
}

// Response
{
  "totalAmount": 250000,
  "feeBreakdown": {
    "baseAmount": 200000,
    "damageFee": 50000,
    "totalAmount": 250000,
    "breakdown_text": "Goi: 200.000 VND, Phat: 50.000 VND, Tong: 250.000 VND"
  }
}
```

## 🔄 Luồng hoàn chỉnh

```
1. User subscription hết hạn (status = expired)
   ↓
2. Frontend gọi API renewal
   POST /payments/momo-subscription-renewal
   ↓
3. Backend tính phí phạt + tạo payment
   ↓
4. Backend trả về MoMo payment URL
   ↓
5. Frontend redirect user đến MoMo
   ↓
6. User thanh toán trên MoMo
   ↓
7. MoMo gọi IPN (POST /payments/momo-ipn)
   Backend verify & update payment → success
   ↓
8. MoMo redirect user về frontend
   GET /payments/momo-return
   ↓
9. Backend verify lần 2 & tạo subscription mới
   ↓
10. Redirect user về /payment/success
```

## ⚙️ Configuration

Cần có trong `.env`:

```env
# MoMo Credentials
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz

# MoMo URLs
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=http://localhost:8080/api/v1/payments/momo-return
MOMO_IPN_URL=http://localhost:8080/api/v1/payments/momo-ipn
MOMO_FRONTEND_URL=http://localhost:5173/driver

# Mock mode (optional)
MOMO_USE_MOCK=false
```

## 📊 So sánh với VNPAY

| Feature | VNPAY | MoMo |
|---------|-------|------|
| Endpoint | `/subscription-renewal` | `/momo-subscription-renewal` |
| Requires IP | ✅ Yes | ❌ No |
| Signature | HMAC SHA512 | HMAC SHA256 |
| Request Method | GET params | POST JSON |
| Response URL field | `paymentUrl` | `paymentUrl` |
| IPN Method | GET | POST |
| Request Type | N/A | `payWithMethod` |
| Payment Options | ATM/Credit Card | ATM/Credit Card/MoMo Wallet/QR |

## 🎁 Tính năng

1. **Tính phí phạt tự động** - Không cần tính thủ công
2. **Tạo subscription mới tự động** - Sau khi thanh toán thành công
3. **Fee breakdown chi tiết** - Hiển thị rõ từng khoản phí
4. **Mock mode** - Test không cần MoMo thật
5. **Response format chuẩn** - Giống với `calculate-and-create-momo-url`
6. **Chọn phương thức thanh toán** - User có thể chọn:
   - Thanh toán bằng thẻ ATM/Visa/Mastercard
   - Thanh toán qua ví MoMo
   - Thanh toán bằng QR code

## ⚠️ Lưu ý

1. **Chỉ gia hạn được subscription đã `expired`**
   - Subscription `active` không thể renewal
   - Subscription `cancelled` không thể renewal

2. **Phí phạt tự động**
   - Backend tự tính phí phạt vượt km
   - Frontend chỉ cần gửi subscription_id

3. **Payment expiry**
   - Payment sẽ tự động expire sau 15 phút
   - Nếu quá hạn → Payment status = `cancelled`

4. **Subscription mới**
   - Chỉ tạo khi payment thành công
   - Start date = ngày thanh toán
   - End date = start date + duration_days

## 🔗 Related APIs

- `GET /payments/momo-return` - MoMo return URL
- `POST /payments/momo-ipn` - MoMo IPN callback
- `GET /payments/momo-query/:orderId` - Query MoMo transaction status
- `POST /payments/mock-momo-payment` - Mock MoMo payment
- `POST /payments/direct-renewal` - Direct renewal (no gateway)

## 🎓 Examples

### cURL

```bash
curl -X POST http://localhost:8080/api/v1/payments/momo-subscription-renewal \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription_id": 1
  }'
```

### JavaScript (Fetch)

```javascript
const response = await fetch('http://localhost:8080/api/v1/payments/momo-subscription-renewal', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    subscription_id: 1
  })
});

const data = await response.json();

// Redirect to MoMo payment
window.location.href = data.paymentUrl;
```

### React Example

```javascript
const handleRenewal = async (subscriptionId) => {
  try {
    const response = await fetch('/api/v1/payments/momo-subscription-renewal', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ subscription_id: subscriptionId })
    });

    const data = await response.json();

    // Show fee breakdown
    toast.info(`Tổng: ${data.feeBreakdown.totalAmount.toLocaleString()} VNĐ`);
    
    // Redirect to MoMo
    window.location.href = data.paymentUrl;
  } catch (error) {
    toast.error('Không thể tạo thanh toán');
  }
};
```

## ✅ Done!

API đã sẵn sàng sử dụng! 🎉
