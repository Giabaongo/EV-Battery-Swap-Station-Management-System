# Payment with Integrated Fee Calculation API

## Overview

**New Endpoint**: `POST /payments/calculate-and-create-vnpay-url`

This endpoint combines fee calculation and VNPAY payment URL generation in a single integrated operation. Instead of calculating fees separately and then creating a payment URL, this endpoint does both seamlessly.

### Key Features
- ✅ Calculates applicable fees based on payment type
- ✅ Combines base package price with calculated fees
- ✅ Generates VNPAY payment URL with total amount
- ✅ Creates payment record in database
- ✅ Returns detailed fee breakdown for UI display
- ✅ **NO MODIFICATION** to existing `/payments/create-vnpay-url` endpoint

## Architecture

```
User Request
    ↓
POST /payments/calculate-and-create-vnpay-url
    ↓
PaymentsController.createPaymentUrlWithFees()
    ↓
PaymentsService.createPaymentUrlWithFees()
    │
    ├─→ Get package info (base_price)
    │
    ├─→ Call FeeCalculationService based on payment_type
    │   ├─ subscription_with_deposit → calculateSubscriptionWithDeposit()
    │   ├─ damage_fee → calculateDamageFee()
    │   ├─ battery_replacement → (no fee or overcharge if distance available)
    │   └─ subscription/other → no additional fee
    │
    ├─→ Calculate total = base_price + fee_amount
    │
    ├─→ Create Payment record with total amount
    │
    ├─→ Generate VNPAY URL with total amount (in VND cents)
    │
    └─→ Return response with feeBreakdown + paymentUrl
            ↓
        Response to UI
            ↓
        User redirected to VNPAY payment gateway
            ↓
        User completes payment
            ↓
        VNPAY calls vnpay-return callback
            ↓
        Payment status updated, subscription created
```

## API Specification

### Request

**URL**: `POST /api/v1/payments/calculate-and-create-vnpay-url`

**Authentication**: Required (JWT Bearer token)
**Roles**: `driver`, `admin`

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body** (CreatePaymentWithFeesDto):
```typescript
{
  user_id: number;              // Required: User ID
  package_id: number;           // Required: Package ID
  vehicle_id: number;           // Required: Vehicle ID
  
  payment_type?: string;        // Optional, default: 'subscription'
                                // Values: 'subscription', 'subscription_with_deposit', 
                                //         'battery_replacement', 'damage_fee', 'other'
  
  distance_traveled?: number;   // Optional: Distance in km (for battery_replacement)
  damage_type?: string;         // Optional: 'low' | 'medium' | 'high' (for damage_fee)
  
  language?: string;            // Optional, default: 'vn' ('vn' or 'en')
  order_info?: string;          // Optional: Custom order description
}
```

### Response

**Status**: 200 OK

**Body** (PaymentWithFeesResponse):
```typescript
{
  payment_id: number;
  paymentUrl: string;           // Ready-to-use VNPAY payment URL
  vnp_txn_ref: string;          // Transaction reference for reconciliation
  
  feeBreakdown: {
    baseAmount: number;         // Package base price
    depositFee?: number;        // Deposit fee (if applicable)
    overchargeFee?: number;     // Overcharge fee (if applicable)
    damageFee?: number;         // Damage fee (if applicable)
    totalAmount: number;        // Total to be paid (VND)
    breakdown_text: string;     // Human-readable breakdown (Vietnamese)
  };
  
  paymentInfo: {
    user_id: number;
    package_id: number;
    vehicle_id: number;
    payment_type: string;
    status: string;             // Always 'pending' initially
    created_at: string;         // ISO timestamp
  };
}
```

## Usage Examples

### Example 1: Subscription with Deposit

**Request**:
```bash
curl -X POST http://localhost:8080/api/v1/payments/calculate-and-create-vnpay-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "package_id": 1,
    "vehicle_id": 1,
    "payment_type": "subscription_with_deposit"
  }'
```

**Response**:
```json
{
  "payment_id": 42,
  "paymentUrl": "https://sandbox.vnpayment.vn/paygate?...",
  "vnp_txn_ref": "3115123456",
  "feeBreakdown": {
    "baseAmount": 500000,
    "depositFee": 400000,
    "totalAmount": 900000,
    "breakdown_text": "Gói: 500,000 VND, Cọc: 400,000 VND, Tổng: 900,000 VND"
  },
  "paymentInfo": {
    "user_id": 1,
    "package_id": 1,
    "vehicle_id": 1,
    "payment_type": "subscription_with_deposit",
    "status": "pending",
    "created_at": "2025-10-31T12:34:56.000Z"
  }
}
```

**Flow**:
1. User clicks "Đăng ký gói với cọc"
2. Frontend calls this endpoint
3. Fee is calculated: 400,000 VND deposit
4. Total: 500,000 (base) + 400,000 (deposit) = 900,000 VND
5. VNPAY URL is generated with amount=900000 (in cents: 90000000)
6. User is redirected to VNPAY payment page
7. After payment, callback updates payment status and creates subscription

### Example 2: Damage Fee

**Request**:
```bash
curl -X POST http://localhost:8080/api/v1/payments/calculate-and-create-vnpay-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2,
    "package_id": 1,
    "vehicle_id": 2,
    "payment_type": "damage_fee",
    "damage_type": "high"
  }'
```

**Response**:
```json
{
  "payment_id": 43,
  "paymentUrl": "https://sandbox.vnpayment.vn/paygate?...",
  "vnp_txn_ref": "3115123457",
  "feeBreakdown": {
    "baseAmount": 500000,
    "damageFee": 5000000,
    "totalAmount": 5500000,
    "breakdown_text": "Phí hư hỏng: 5,000,000 VND"
  },
  "paymentInfo": {
    "user_id": 2,
    "package_id": 1,
    "vehicle_id": 2,
    "payment_type": "damage_fee",
    "status": "pending",
    "created_at": "2025-10-31T12:35:00.000Z"
  }
}
```

### Example 3: Simple Subscription (No Fees)

**Request**:
```bash
curl -X POST http://localhost:8080/api/v1/payments/calculate-and-create-vnpay-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 3,
    "package_id": 2,
    "vehicle_id": 3,
    "payment_type": "subscription"
  }'
```

**Response**:
```json
{
  "payment_id": 44,
  "paymentUrl": "https://sandbox.vnpayment.vn/paygate?...",
  "vnp_txn_ref": "3115123458",
  "feeBreakdown": {
    "baseAmount": 1000000,
    "totalAmount": 1000000,
    "breakdown_text": "Tổng tiền: 1,000,000 VND"
  },
  "paymentInfo": {
    "user_id": 3,
    "package_id": 2,
    "vehicle_id": 3,
    "payment_type": "subscription",
    "status": "pending",
    "created_at": "2025-10-31T12:35:30.000Z"
  }
}
```

## Database Changes

When this endpoint is called, it:

1. **Creates Payment record**:
   ```
   INSERT INTO payments (
     user_id, package_id, vehicle_id, amount, method, 
     status, payment_type, vnp_txn_ref, order_info
   ) VALUES (...)
   ```
   - `amount` = base_price + calculated_fee
   - `status` = 'pending'
   - `method` = 'vnpay'
   - `payment_type` = provided payment_type

2. **DOES NOT create Subscription**:
   - Subscription is created **after** successful payment callback
   - Only when `handleVnpayReturn()` is called with success response

## Comparison: New vs Old Endpoints

### Old Endpoint: `/payments/create-vnpay-url`
- Takes: package_id, vehicle_id, user_id, language
- Does: Creates VNPAY URL with **base package price only**
- Returns: paymentUrl only (no fee breakdown)
- Use case: Simple subscription without fees
- **Status**: Still available for backward compatibility

### New Endpoint: `/payments/calculate-and-create-vnpay-url`
- Takes: package_id, vehicle_id, user_id, payment_type, optional fee parameters
- Does: Calculates fees + creates VNPAY URL with **total amount**
- Returns: paymentUrl + detailed fee breakdown
- Use case: Any payment scenario (subscription, deposits, damage fees, etc.)
- **Status**: Recommended for new implementations

## Fee Calculation Details

### Subscription with Deposit
```
Base Price: package.base_price (e.g., 500,000 VND)
Deposit Fee: 400,000 VND (fixed)
Total: 900,000 VND

Breakdown: "Gói: 500,000 VND, Cọc: 400,000 VND, Tổng: 900,000 VND"
```

### Damage Fee (Severity-based)
```
Severity: low, medium, high
Fees retrieved from config table:
- low → Minor_Damage_Fee
- medium → Battery_Damage_Penalty
- high → Equipment_Loss_Penalty

Example: high → 5,000,000 VND
Breakdown: "Phí hư hỏng: 5,000,000 VND"
```

### Battery Replacement
```
- If distance_traveled provided: Could calculate overcharge
- Currently: Uses base price only
- Future enhancement: Could support tiered km overcharge

Base Price: package.base_price
Total: package.base_price (+ overcharge if applicable)
```

## Testing with Seed Data

The backend includes test data created by `prisma/seed-test-data.ts`:

**Test Users**:
- Admin: admin@test.com (user_id: 18)
- Driver 1: driver1@test.com (user_id: 19)
- Driver 2: driver2@test.com (user_id: 20)
- Staff: staff@test.com (user_id: 21)

**Test Packages**:
- Package 1: "Basic" - 500,000 VND
- Package 2: "Premium" - 1,000,000 VND
- Package 3: "Enterprise" - 2,000,000 VND

**Test Vehicles**:
- Vehicle 1: Tesla Model 3 (driver1)
- Vehicle 2: Nissan Leaf (driver2)
- Vehicle 3: BMW i3 (admin)

### Test Cases

**TC1: Subscription with Deposit**
```bash
curl -X POST http://localhost:8080/api/v1/payments/calculate-and-create-vnpay-url \
  -H "Authorization: Bearer <TOKEN_FOR_DRIVER1>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 19,
    "package_id": 1,
    "vehicle_id": 1,
    "payment_type": "subscription_with_deposit"
  }'
```

Expected: Total = 900,000 VND (500,000 base + 400,000 deposit)

**TC2: Damage Fee High**
```bash
curl -X POST http://localhost:8080/api/v1/payments/calculate-and-create-vnpay-url \
  -H "Authorization: Bearer <TOKEN_FOR_DRIVER2>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 20,
    "package_id": 2,
    "vehicle_id": 2,
    "payment_type": "damage_fee",
    "damage_type": "high"
  }'
```

Expected: Total = 1,000,000 (base) + 5,000,000 (high damage) = 6,000,000 VND

**TC3: Simple Subscription**
```bash
curl -X POST http://localhost:8080/api/v1/payments/calculate-and-create-vnpay-url \
  -H "Authorization: Bearer <TOKEN_FOR_ADMIN>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 18,
    "package_id": 3,
    "vehicle_id": 3,
    "payment_type": "subscription"
  }'
```

Expected: Total = 2,000,000 VND (base only, no fees)

## Payment Flow (Complete)

```
1. CLIENT: User selects payment option
   ↓
2. CLIENT: Call GET /packages to see available packages
   ↓
3. CLIENT: User selects package + payment type
   ↓
4. CLIENT: Call POST /payments/calculate-and-create-vnpay-url
   ↓
5. BACKEND: Calculate fees + Create payment record + Generate VNPAY URL
   ↓
6. CLIENT: Receive paymentUrl + feeBreakdown
   ↓
7. CLIENT: Display fee breakdown to user
   ↓
8. CLIENT: Redirect to VNPAY payment gateway
   ↓
9. USER: Complete payment on VNPAY
   ↓
10. VNPAY: Return to http://localhost:8080/api/v1/payments/vnpay-return?vnp_Params...
   ↓
11. BACKEND: handleVnpayReturn()
    - Verify VNPAY signature
    - Update payment status (success/failed/cancelled)
    - Create subscription (if success)
    - Redirect to frontend result page
   ↓
12. CLIENT: Display payment result to user
```

## Integration with Frontend

**Frontend should**:
1. Call this endpoint after user selects payment option
2. Display `feeBreakdown.breakdown_text` to user
3. Show total amount: `feeBreakdown.totalAmount`
4. Redirect to `paymentUrl` when user confirms payment
5. Use `vnp_txn_ref` for payment reconciliation

**Example Frontend Implementation**:
```javascript
// React example
const handlePaymentClick = async () => {
  const response = await fetch('/api/v1/payments/calculate-and-create-vnpay-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      user_id: currentUser.id,
      package_id: selectedPackage.id,
      vehicle_id: selectedVehicle.id,
      payment_type: 'subscription_with_deposit',
      language: 'vn'
    })
  });

  const data = await response.json();
  
  // Display fee breakdown
  console.log('Fee Breakdown:', data.feeBreakdown.breakdown_text);
  console.log('Total:', data.feeBreakdown.totalAmount);
  
  // Store transaction reference
  sessionStorage.setItem('vnp_txn_ref', data.vnp_txn_ref);
  
  // Redirect to VNPAY
  window.location.href = data.paymentUrl;
};
```

## Error Handling

### Common Errors

**400 Bad Request - Package not found**:
```json
{
  "statusCode": 400,
  "message": "Package not found"
}
```

**400 Bad Request - Package not active**:
```json
{
  "statusCode": 400,
  "message": "Package is not active"
}
```

**401 Unauthorized**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**403 Forbidden - Insufficient roles**:
```json
{
  "statusCode": 403,
  "message": "Forbidden - You don't have permission to access this resource"
}
```

## Troubleshooting

### Issue: VNPAY payment URL not working
- Check: Is VNPAY TMN_CODE and Hash Secret correct?
- Check: Is `vnp_Amount` in cents? (amount * 100)
- Check: Is signature calculation correct? (HMAC SHA512)
- Solution: Review `/backend/src/modules/payments/config/vnpay.config.ts`

### Issue: Total amount seems wrong
- Check: Is fee_type correctly identified?
- Check: Are fee amounts retrieved from config table?
- Solution: Query config table: `SELECT * FROM config WHERE name LIKE '%Fee%'`

### Issue: Payment creates but doesn't show in database
- Check: Is PaymentTypeEnum value correct?
- Check: Are user_id, package_id, vehicle_id valid?
- Solution: Check `payments` table status = 'pending'

## Security Considerations

1. **Authentication**: This endpoint requires valid JWT token
2. **Authorization**: Only 'driver' and 'admin' roles can access
3. **VNPAY Signature**: All parameters are verified by HMAC SHA512
4. **IP Address**: Captured from request headers for VNPAY logging
5. **Database Transaction**: Payment record is created atomically

## Future Enhancements

1. **Overcharge Fee Calculation**: Support km-based tiered fees
2. **Discount Codes**: Apply discount to total amount
3. **Multiple Fee Types**: Combine subscription + damage + overcharge in one call
4. **Installment Plan**: Support split payments
5. **Fee Waivers**: Admin ability to skip fees for certain payments

## References

- [VNPAY Payment Guide](./VNPAY_PAYMENT_GUIDE.md)
- [Fee Calculation Guide](./FEE_CALCULATION_GUIDE.md)
- [API Testing Guide](./API_TESTING_GUIDE.md)
- [Payment System Architecture](./PAYMENT_SYSTEM_UPDATE_SUMMARY.md)
