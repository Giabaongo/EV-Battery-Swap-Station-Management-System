# VNPAY Payment Integration Guide

## Overview
API tích hợp VNPAY sandbox để xử lý thanh toán cho subscription packages. Flow: User chọn gói → Tạo payment URL → VNPAY xử lý → Return callback → Tạo subscription tự động.

## VNPAY Sandbox Setup

### 1. Đăng ký VNPAY Sandbox
- Website: https://sandbox.vnpayment.vn/
- Đăng ký tài khoản test
- Lấy credentials: `TMN_CODE` và `HASH_SECRET`

### 2. Environment Variables
Thêm vào file `.env`:
```env
# VNPAY Configuration
VNP_TMN_CODE=YOUR_TMN_CODE
VNP_HASH_SECRET=YOUR_HASH_SECRET
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:3000/payments/vnpay-return

# Frontend URL for redirect
FRONTEND_URL=http://localhost:3001
```

### 3. VNPAY Test Cards
**Thẻ ATM nội địa:**
- Bank: NCB
- Card Number: 9704198526191432198
- Card Holder: NGUYEN VAN A
- Issue Date: 07/15
- OTP: 123456

**Thẻ quốc tế:**
- Card Number: 4111111111111111 (Visa)
- Card Holder: NGUYEN VAN A
- Expiry: 12/25
- CVV: 123

## Database Schema

### Payment Model
```prisma
model Payment {
  payment_id        Int           @id @default(autoincrement())
  user_id           Int
  subscription_id   Int?
  package_id        Int?
  amount            Decimal       @db.Decimal(12, 2)
  payment_time      DateTime?
  method            PaymentMethod
  status            PaymentStatus
  invoice_url       String?
  transaction_id    String?       @db.VarChar(100)
  vnp_txn_ref       String?       @unique @db.VarChar(100)
  vnp_response_code String?       @db.VarChar(10)
  vnp_bank_code     String?       @db.VarChar(50)
  vnp_card_type     String?       @db.VarChar(50)
  order_info        String?       @db.VarChar(255)
  created_at        DateTime      @default(now())
  updated_at        DateTime      @updatedAt

  // Relationships
  user         User                   @relation(fields: [user_id], references: [user_id])
  subscription Subscription?          @relation(fields: [subscription_id], references: [subscription_id])
  package      BatteryServicePackage? @relation(fields: [package_id], references: [package_id])
}
```

### Enums
```prisma
enum PaymentMethod {
  vnpay
  momo
  zalopay
  cash
  credit_card
  bank_transfer
  e_wallet
}

enum PaymentStatus {
  pending
  success
  failed
  cancelled
  paid
}
```

## API Endpoints

### 1. Create VNPAY Payment URL
**POST** `/payments/create-vnpay-url`
- **Auth**: Required (driver, admin)
- **Body**:
```json
{
  "user_id": 1,
  "package_id": 1,
  "vehicle_id": 1,
  "orderDescription": "Thanh toan goi Basic Package",
  "language": "vn"  // "vn" or "en"
}
```
- **Response**:
```json
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=10000000&...",
  "payment_id": 123,
  "vnp_txn_ref": "04141530"
}
```

**Flow:**
1. Validate package exists và active
2. Tạo payment record với status = pending
3. Generate unique `vnp_txn_ref` (timestamp-based)
4. Build VNPAY parameters với signature
5. Return payment URL để redirect user

**Frontend Usage:**
```javascript
// 1. Call API để tạo payment URL
const response = await fetch('/payments/create-vnpay-url', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_id: 1,
    package_id: 2,
    vehicle_id: 1
  })
});

const { paymentUrl } = await response.json();

// 2. Redirect user to VNPAY
window.location.href = paymentUrl;
```

### 2. VNPAY Return URL (Redirect)
**GET** `/payments/vnpay-return`
- **Auth**: Not required (public endpoint)
- **Query Params**: VNPAY sends all transaction details
- **Response**: Redirect to frontend
  - Success: `http://localhost:3001/payment/success?subscription_id=123`
  - Failed: `http://localhost:3001/payment/failed?code=24`
  - Error: `http://localhost:3001/payment/error?message=...`

**VNPAY Response Codes:**
- `00`: Success
- `07`: Transaction success but suspicious
- `09`: Card not registered for internet banking
- `10`: Incorrect card info
- `11`: Card expired
- `12`: Card locked
- `13`: Wrong OTP
- `24`: User cancelled
- `51`: Insufficient balance
- `65`: Daily limit exceeded
- `75`: Payment bank under maintenance
- `79`: Transaction timeout

**Flow:**
1. Verify VNPAY signature (secure hash)
2. Find payment by `vnp_txn_ref`
3. Update payment status based on response code
4. If success → Create subscription automatically
5. Link payment to subscription
6. Redirect to frontend với result

### 3. VNPAY IPN (Instant Payment Notification)
**GET** `/payments/vnpay-ipn`
- **Auth**: Not required (VNPAY server callback)
- **Query Params**: Same as return URL
- **Response**:
```json
{
  "RspCode": "00",
  "Message": "Confirm Success"
}
```

**Purpose:** VNPAY gọi IPN để confirm payment. Backend cần response với RspCode để VNPAY biết đã nhận được thông báo.

**Important:** IPN được gọi từ VNPAY server, không phải từ user browser. Nên cần check signature cẩn thận.

### 4. Get Payment by ID
**GET** `/payments/:id`
- **Auth**: Required
- **Response**: Payment detail với user, package, subscription info

### 5. Get Payment by Transaction Reference
**GET** `/payments/txn/:vnpTxnRef`
- **Auth**: Required
- **Response**: Payment detail by VNPAY transaction reference

### 6. Get User's Payment History
**GET** `/payments/user/:userId`
- **Auth**: Required (driver, admin)
- **Response**: Array of user's payments

### 7. Get All Payments
**GET** `/payments`
- **Auth**: Required (admin only)
- **Response**: Array of all payments

## Payment Flow Diagram

```
User (Frontend)
    |
    | 1. POST /payments/create-vnpay-url
    v
Backend API
    |
    | 2. Create payment (pending)
    | 3. Generate VNPAY URL with signature
    v
    |
    | 4. Return paymentUrl
    v
User redirected to VNPAY
    |
    | 5. User enters card info & confirms
    v
VNPAY Payment Gateway
    |
    | 6. Process payment
    v
    |
    | 7. Redirect to /payments/vnpay-return
    v
Backend API
    |
    | 8. Verify signature
    | 9. Update payment status
    | 10. Create subscription (if success)
    v
    |
    | 11. Redirect to frontend
    v
Frontend Success/Failed Page
```

## Security Features

### 1. Signature Verification
```typescript
// VNPAY uses HMAC SHA512
const hmac = crypto.createHmac('sha512', vnpHashSecret);
const signature = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
```

### 2. Parameter Sorting
VNPAY requires parameters sorted alphabetically before signing:
```typescript
const sortObject = (obj: any) => {
  const sorted: any = {};
  const keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
};
```

### 3. Unique Transaction Reference
```typescript
const vnpTxnRef = moment().format('DDHHmmss'); // Format: DDHHmmss
// Example: 04141530 = Day 04, Hour 14, Minute 15, Second 30
```

## Error Handling

### Common Errors:
- **Invalid signature**: VNPAY params bị tamper
- **Package not found**: package_id không tồn tại
- **Package inactive**: Package đã bị disable
- **Duplicate transaction**: vnp_txn_ref đã tồn tại

### Frontend Error Handling:
```javascript
// Handle return from VNPAY
const urlParams = new URLSearchParams(window.location.search);
const subscriptionId = urlParams.get('subscription_id');
const errorCode = urlParams.get('code');
const errorMessage = urlParams.get('message');

if (subscriptionId) {
  // Success - show success page
  showSuccessMessage(subscriptionId);
} else if (errorCode) {
  // Failed - show error with code
  showErrorMessage(errorCode);
} else if (errorMessage) {
  // Error - show error message
  showErrorMessage(errorMessage);
}
```

## Testing Guide

### Test Flow 1: Successful Payment
```bash
# 1. Create payment URL
POST http://localhost:3000/payments/create-vnpay-url
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "user_id": 1,
  "package_id": 1,
  "vehicle_id": 1
}

# 2. Copy paymentUrl from response
# 3. Open in browser
# 4. Use test card: 9704198526191432198
# 5. Enter OTP: 123456
# 6. Should redirect to frontend success page
# 7. Check subscription created:
GET http://localhost:3000/subscriptions/user/1/active
```

### Test Flow 2: Failed Payment
```bash
# Same as above but:
# - Cancel payment in VNPAY page
# - Or use invalid card
# - Should redirect to failed page
# - Payment status = failed
# - No subscription created
```

### Test Flow 3: Check Payment History
```bash
GET http://localhost:3000/payments/user/1
Authorization: Bearer YOUR_TOKEN

# Should show all payments with status
```

## Integration Checklist

Backend:
- [x] Payment model với VNPAY fields
- [x] VNPAY config với env variables
- [x] Create payment URL với signature
- [x] Handle return callback
- [x] Handle IPN callback
- [x] Auto-create subscription on success
- [x] Payment history endpoints

Frontend:
- [ ] Payment form để select package
- [ ] Call create-vnpay-url API
- [ ] Redirect to VNPAY
- [ ] Success page hiển thị subscription info
- [ ] Failed page hiển thị error code
- [ ] Payment history page

Testing:
- [ ] Test với VNPAY sandbox cards
- [ ] Test success flow
- [ ] Test failed flow (cancel, wrong card)
- [ ] Test timeout
- [ ] Test signature verification
- [ ] Test duplicate transaction
- [ ] Test IPN callback

## Production Deployment

### 1. Update Environment Variables
```env
# Production VNPAY
VNP_TMN_CODE=YOUR_PRODUCTION_TMN_CODE
VNP_HASH_SECRET=YOUR_PRODUCTION_HASH_SECRET
VNP_URL=https://vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=https://yourdomain.com/payments/vnpay-return

FRONTEND_URL=https://yourdomain.com
```

### 2. Enable HTTPS
VNPAY requires HTTPS for production return URL.

### 3. Configure VNPAY IPN URL
Login to VNPAY merchant portal and set IPN URL:
```
https://yourdomain.com/payments/vnpay-ipn
```

### 4. Monitor Payments
Setup logging và monitoring cho:
- Failed payments
- Signature mismatches
- Timeout transactions
- IPN callbacks

## Troubleshooting

### Issue: "Invalid signature"
- Check VNP_HASH_SECRET correct
- Verify parameter sorting
- Check URL encoding

### Issue: "Payment not found"
- vnp_txn_ref không unique
- Database connection issues
- Check migration applied

### Issue: "Subscription not created"
- Payment status không success
- Package fields missing
- Check service logic

### Issue: "VNPAY return timeout"
- Network issues
- Check return URL accessible
- Test IPN endpoint separately

## Additional Features (Future)

- [ ] Refund functionality
- [ ] Payment reports/analytics
- [ ] Auto-retry failed payments
- [ ] Payment reminders
- [ ] Multiple payment methods (Momo, ZaloPay)
- [ ] Installment payment
- [ ] Promotional codes/discounts
- [ ] Invoice generation PDF
- [ ] Email notifications
- [ ] Webhook notifications to frontend
