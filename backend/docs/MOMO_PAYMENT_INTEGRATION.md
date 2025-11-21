# MoMo Payment Integration Guide

## 📋 Overview

This guide explains how to integrate and use MoMo payment gateway in the EV Battery Swap Station Management System.

## 🔧 Configuration

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# MOMO Configuration (Test/Sandbox)
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=your_momo_access_key_here
MOMO_SECRET_KEY=your_momo_secret_key_here
MOMO_REDIRECT_URL=http://localhost:3000/payment/momo/return
MOMO_IPN_URL=http://localhost:8080/api/v1/payments/momo-ipn
MOMO_FRONTEND_URL=http://localhost:5173/driver
```

### 2. Get MoMo Credentials

1. Register at [MoMo Developer Portal](https://developers.momo.vn/)
2. Create a new application
3. Get your `MOMO_ACCESS_KEY` and `MOMO_SECRET_KEY`
4. Configure your IPN URL and Redirect URL in MoMo dashboard

## 🚀 API Endpoints

### Basic Payment URLs

#### 1. Create MoMo Payment URL (Basic)
```http
POST /api/v1/payments/create-momo-url
```

**Request Body:**
```json
{
  "user_id": 1,
  "package_id": 1,
  "vehicle_id": 1
}
```

**Response:**
```json
{
  "payment_id": 123,
  "orderId": "MOMO_20250121_123456",
  "payUrl": "https://test-payment.momo.vn/v2/gateway/...",
  "deeplink": "momo://...",
  "qrCodeUrl": "https://test-payment.momo.vn/qr/...",
  "amount": 200000,
  "message": "MoMo payment URL created successfully"
}
```

#### 2. Create MoMo Payment URL (Advanced - Multiple Types)
```http
POST /api/v1/payments/create-momo-url-advanced
```

**Supported Payment Types:**
- `subscription` - Basic subscription
- `subscription_with_deposit` - Subscription + battery deposit
- `battery_deposit` - Battery deposit only
- `battery_replacement` - Battery replacement fee
- `damage_fee` - Damage repair fee
- `other` - Miscellaneous payments

**Request Body:**
```json
{
  "user_id": 1,
  "package_id": 1,
  "vehicle_id": 1,
  "payment_type": "subscription_with_deposit"
}
```

### Integrated Fee Calculation + Payment

#### 3. Calculate Fees and Create MoMo URL
```http
POST /api/v1/payments/calculate-and-create-momo-url
```

This endpoint combines fee calculation with payment URL creation.

**Request Body - Subscription with Deposit:**
```json
{
  "user_id": 1,
  "package_id": 1,
  "vehicle_id": 1,
  "payment_type": "subscription_with_deposit"
}
```

**Request Body - Damage Fee:**
```json
{
  "user_id": 1,
  "package_id": 1,
  "vehicle_id": 1,
  "payment_type": "damage_fee",
  "damage_type": "medium"
}
```

**Response:**
```json
{
  "payment_id": 124,
  "orderId": "MOMO_20250121_124456",
  "paymentUrl": "https://test-payment.momo.vn/v2/gateway/...",
  "amount": 600000,
  "feeBreakdown": {
    "baseAmount": 200000,
    "depositFee": 400000,
    "damageFee": 0,
    "overchargeFee": 0,
    "totalAmount": 600000,
    "breakdown_text": "Gói: 200.000 VND, Cọc pin: 400.000 VND, Tổng: 600.000 VND"
  },
  "momoExtras": {
    "deeplink": "momo://app.momo.vn/...",
    "qrCodeUrl": "https://test-payment.momo.vn/qr/..."
  }
}
```

### Callback Endpoints

#### 4. MoMo Return URL (User Redirect)
```http
GET /api/v1/payments/momo-return
```

Automatically handles user redirect from MoMo payment page.

**Query Parameters (from MoMo):**
- `partnerCode`
- `orderId`
- `requestId`
- `amount`
- `orderInfo`
- `orderType`
- `transId`
- `resultCode` (0 = success, others = failed)
- `message`
- `payType`
- `responseTime`
- `extraData`
- `signature`

**Redirects to:**
- Success: `{MOMO_FRONTEND_URL}/payment/success?subscription_id={id}`
- Failed: `{MOMO_FRONTEND_URL}/payment/failed?code={resultCode}`
- Error: `{MOMO_FRONTEND_URL}/payment/error?message={error}`

#### 5. MoMo IPN (Server Notification)
```http
POST /api/v1/payments/momo-ipn
```

MoMo will send server-to-server notification to this endpoint.

**Request Body (from MoMo):**
```json
{
  "partnerCode": "MOMO",
  "orderId": "MOMO_20250121_123456",
  "requestId": "REQ_20250121_123456",
  "amount": 200000,
  "orderInfo": "Subscription payment",
  "orderType": "momo_wallet",
  "transId": 12345678,
  "resultCode": 0,
  "message": "Successful",
  "payType": "qr",
  "responseTime": 1642784156789,
  "extraData": "",
  "signature": "..."
}
```

**Response (to MoMo):**
```json
{
  "resultCode": 0,
  "message": "Success"
}
```

### Query Transaction Status

#### 6. Query MoMo Transaction Status
```http
GET /api/v1/payments/momo-query/:orderId
```

**Example:**
```http
GET /api/v1/payments/momo-query/MOMO_20250121_123456
```

**Response:**
```json
{
  "partnerCode": "MOMO",
  "orderId": "MOMO_20250121_123456",
  "requestId": "REQ_20250121_123456",
  "amount": 200000,
  "transId": 12345678,
  "resultCode": 0,
  "message": "Successful",
  "responseTime": 1642784156789
}
```

## 🔄 Payment Flow

### Standard Flow:

```
1. Frontend calls /calculate-and-create-momo-url
   ↓
2. Backend creates payment record (status: pending)
   ↓
3. Backend calls MoMo API to create payment
   ↓
4. Backend returns payUrl, deeplink, qrCodeUrl
   ↓
5. User pays via MoMo (3 options):
   - Browser: Open payUrl
   - Mobile App: Open deeplink
   - QR Code: Scan qrCodeUrl
   ↓
6. User completes payment on MoMo
   ↓
7. MoMo redirects user to /momo-return (frontend sees success)
   ↓
8. MoMo sends IPN to /momo-ipn (backend creates subscription)
   ↓
9. Backend updates payment status to success
   ↓
10. Backend creates new subscription (if applicable)
```

### Mobile Integration:

For mobile apps, use the `deeplink` from the response:

```javascript
// React Native example
const { deeplink } = response.momoExtras;
Linking.openURL(deeplink);
```

### QR Code Integration:

For QR code payments, display the `qrCodeUrl`:

```html
<!-- HTML example -->
<img src="{{ qrCodeUrl }}" alt="Scan to pay with MoMo" />
```

## 🔐 Security

### Signature Verification

MoMo uses HMAC SHA256 for signature generation and verification.

**Signature Generation (Request):**
```
rawSignature = "accessKey={accessKey}&amount={amount}&extraData={extraData}&ipnUrl={ipnUrl}&orderId={orderId}&orderInfo={orderInfo}&partnerCode={partnerCode}&redirectUrl={redirectUrl}&requestId={requestId}&requestType={requestType}"

signature = HMAC_SHA256(rawSignature, secretKey)
```

**Signature Verification (Callback):**
```
rawSignature = "accessKey={accessKey}&amount={amount}&extraData={extraData}&message={message}&orderId={orderId}&orderInfo={orderInfo}&orderType={orderType}&partnerCode={partnerCode}&payType={payType}&requestId={requestId}&responseTime={responseTime}&resultCode={resultCode}&transId={transId}"

expectedSignature = HMAC_SHA256(rawSignature, secretKey)

isValid = (signature === expectedSignature)
```

## 🆚 MoMo vs VNPay

| Feature | VNPay | MoMo |
|---------|-------|------|
| **Signature Algorithm** | HMAC SHA512 | HMAC SHA256 |
| **Request Method** | GET with query params | POST with JSON body |
| **Response** | Redirect URL only | payUrl + deeplink + qrCodeUrl |
| **Mobile Support** | ❌ | ✅ (deeplink) |
| **QR Code** | ❌ | ✅ (qrCodeUrl) |
| **IPN Method** | GET | POST |
| **Query API** | ❌ | ✅ |
| **Payment Methods** | Bank cards, wallets | MoMo wallet, linked cards |

## 🧪 Testing

### Test Payment

MoMo provides a sandbox environment for testing:

1. Use test credentials from MoMo Developer Portal
2. Test phone numbers: `0999999999` (any 10-digit number starting with 09)
3. Test OTP: `123456` (in sandbox mode)

### Mock Payment Flow

For local testing without MoMo gateway:

```bash
# Create test payment
curl -X POST http://localhost:8080/api/v1/payments/mock-payment \
  -H "Content-Type: application/json" \
  -d '{
    "vnp_txn_ref": "MOMO_20250121_TEST",
    "success": true
  }'
```

## 📱 Frontend Integration Examples

### React/Next.js

```typescript
// Create MoMo payment
const createMoMoPayment = async () => {
  const response = await fetch('/api/v1/payments/calculate-and-create-momo-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      user_id: userId,
      package_id: packageId,
      vehicle_id: vehicleId,
      payment_type: 'subscription_with_deposit'
    })
  });

  const data = await response.json();
  
  // For web: Redirect to payment page
  window.location.href = data.paymentUrl;
  
  // For mobile: Use deeplink
  // window.location.href = data.momoExtras.deeplink;
  
  // For QR: Display QR code
  // setQrCodeUrl(data.momoExtras.qrCodeUrl);
};
```

### Display QR Code

```tsx
import QRCode from 'qrcode.react';

function MoMoPayment({ paymentUrl, qrCodeUrl }) {
  return (
    <div>
      <h3>Choose payment method:</h3>
      
      {/* Option 1: Web payment */}
      <button onClick={() => window.open(paymentUrl)}>
        Pay via MoMo Web
      </button>
      
      {/* Option 2: QR Code */}
      <div>
        <p>Scan QR code with MoMo app:</p>
        <img src={qrCodeUrl} alt="MoMo QR Code" />
      </div>
    </div>
  );
}
```

## 🐛 Troubleshooting

### Common Issues

**1. Signature mismatch**
- Verify all parameters are in alphabetical order
- Check secret key is correct
- Ensure no extra spaces in parameter values

**2. IPN not received**
- Verify IPN URL is publicly accessible (use ngrok for local testing)
- Check firewall settings
- Verify POST method is used for MoMo IPN (not GET)

**3. Payment creation fails**
- Check MoMo credentials are correct
- Verify amount is >= 1,000 VND
- Check orderId is unique

### Enable Debug Logging

Set environment variable:
```bash
DEBUG=momo:*
```

This will log all MoMo API requests/responses.

## 📞 Support

- MoMo Developer Portal: https://developers.momo.vn/
- MoMo API Documentation: https://developers.momo.vn/v3/docs/payment/api/
- Email: developer@momo.vn

## 📝 Notes

- **Sandbox vs Production**: Make sure to use correct credentials for each environment
- **Security**: Never expose `MOMO_SECRET_KEY` in frontend code
- **IPN vs Return**: Always handle subscription creation in IPN callback, not in return URL
- **Testing**: Use ngrok or similar tools to test IPN callbacks locally
