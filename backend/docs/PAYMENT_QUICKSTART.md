# Payment API - Quick Start

## 🚀 Setup

### 1. Install Dependencies
```bash
npm install qs moment
```

### 2. Run Migration
```bash
npx prisma migrate dev --name add_payment_fields
npx prisma generate
```

### 3. Configure Environment
Copy `.env.example` and update with your VNPAY credentials:
```env
VNP_TMN_CODE=YOUR_TMN_CODE
VNP_HASH_SECRET=YOUR_HASH_SECRET
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:3000/payments/vnpay-return
FRONTEND_URL=http://localhost:3001
```

## 📋 API Endpoints

### Create Payment URL
```bash
POST http://localhost:3000/payments/create-vnpay-url
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "user_id": 1,
  "package_id": 1,
  "vehicle_id": 1,
  "language": "vn"
}
```

**Response:**
```json
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "payment_id": 1,
  "vnp_txn_ref": "04141530"
}
```

### Get Payment History
```bash
GET http://localhost:3000/payments/user/:userId
Authorization: Bearer YOUR_TOKEN
```

## 🧪 Testing with VNPAY Sandbox

### Test Card (ATM):
- Bank: NCB
- Card: **9704198526191432198**
- Holder: NGUYEN VAN A
- Issue: 07/15
- OTP: **123456**

### Test Flow:
1. Call `POST /payments/create-vnpay-url`
2. Get `paymentUrl` from response
3. Redirect browser to `paymentUrl`
4. Enter test card info
5. Enter OTP: 123456
6. VNPAY redirects to return URL
7. Backend auto-creates subscription
8. User redirected to frontend success page

## 📚 Full Documentation

- **Payment Guide**: `docs/VNPAY_PAYMENT_GUIDE.md` - Complete VNPAY integration guide
- **Subscription API**: `docs/SUBSCRIPTION_API.md` - Subscription endpoints

## 🔄 Payment Flow

```
User → Create Payment URL → VNPAY Gateway → User Pays → Return Callback → Create Subscription → Success Page
```

## ✅ What's Included

- ✅ VNPAY payment URL generation with signature
- ✅ Payment record tracking (pending → success/failed)
- ✅ Return URL handler with signature verification
- ✅ IPN (Instant Payment Notification) handler
- ✅ Auto-create subscription on successful payment
- ✅ Payment history endpoints
- ✅ Full authentication & authorization
- ✅ TypeScript types & validation

## 🛠️ Files Created/Modified

**New Files:**
- `src/payments/payments.service.ts` - Payment logic
- `src/payments/payments.controller.ts` - API endpoints
- `src/payments/payments.module.ts` - Module config
- `src/payments/config/vnpay.config.ts` - VNPAY configuration
- `src/payments/dto/create-payment.dto.ts` - Payment request DTO
- `src/payments/dto/vnpay-return.dto.ts` - VNPAY response types
- `docs/VNPAY_PAYMENT_GUIDE.md` - Complete documentation

**Updated Files:**
- `prisma/models/payments.prisma` - Added VNPAY fields
- `prisma/models/subscriptions.prisma` - Added payment relation
- `prisma/models/battery-service-packages.prisma` - Added payment relation
- `src/app.module.ts` - Import PaymentsModule

## 🔐 Security Features

- HMAC SHA512 signature verification
- Parameter sorting before signing
- Unique transaction reference
- Signature validation on return & IPN
- Protected endpoints with JWT auth

## 🎯 Next Steps

1. Get VNPAY sandbox credentials from https://sandbox.vnpayment.vn/
2. Update `.env` with credentials
3. Test with provided test card
4. Implement frontend payment UI
5. Test full payment flow
6. Monitor payment logs

## 💡 Tips

- Always test with sandbox before production
- Check payment status before creating subscription
- Log all VNPAY callbacks for debugging
- Handle all VNPAY response codes properly
- Use HTTPS in production for return URL
