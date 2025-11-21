# Payment Vehicle Assignment Implementation

## 📋 Overview

Khi thanh toán thành công, subscription sẽ được tự động gán `vehicle_id` từ payment để liên kết với xe cụ thể của user.

## 🔄 Changes Made

### 1. Database Schema Update

**File:** `prisma/models/payments.prisma`

Added `vehicle_id` field to Payment model:

```prisma
model Payment {
  // ... other fields
  vehicle_id        Int?  // Vehicle for this payment/subscription
  // ... other fields
}
```

**Migration:** `20251029090852_add_vehicle_id_to_payments`

### 2. Payment Service Updates

**File:** `src/modules/payments/payments.service.ts`

#### 2.1. Create Payment URL (VNPAY)

```typescript
const payment = await this.prisma.payment.create({
  data: {
    user_id: createPaymentDto.user_id,
    package_id: createPaymentDto.package_id,
    vehicle_id: createPaymentDto.vehicle_id, // ← Save vehicle_id
    // ... other fields
  },
});
```

#### 2.2. Handle Payment Return (Success)

```typescript
const subscription = await this.prisma.subscription.create({
  data: {
    user_id: payment.user_id,
    package_id: payment.package_id || 0,
    vehicle_id: payment.vehicle_id, // ← Assign from payment
    start_date: startDate,
    end_date: endDate,
    status: 'active',
    swap_used: 0,
  },
});
```

#### 2.3. Mock Payment (Testing)

```typescript
const payment = await this.prisma.payment.create({
  data: {
    user_id: mockPaymentDto.user_id,
    package_id: mockPaymentDto.package_id,
    vehicle_id: mockPaymentDto.vehicle_id, // ← Save vehicle_id
    // ... other fields
  },
});

// Later when creating subscription
subscription = await this.prisma.subscription.create({
  data: {
    user_id: mockPaymentDto.user_id,
    package_id: mockPaymentDto.package_id,
    vehicle_id: mockPaymentDto.vehicle_id, // ← Assign from payment
    // ... other fields
  },
});
```

## 📊 Flow Diagram

```
┌─────────────────┐
│ User selects    │
│ - Package       │
│ - Vehicle       │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Create Payment  │
│ vehicle_id: 5   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Payment Success │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Create          │
│ Subscription    │
│ vehicle_id: 5   │ ← Copied from payment
└─────────────────┘
```

## 🔧 API Usage

### Create Payment with Vehicle

**Endpoint:** `POST /api/v1/payments/create-vnpay-url`

```json
{
  "user_id": 1,
  "package_id": 2,
  "vehicle_id": 5,          // ← Vehicle to assign
  "orderDescription": "Subscription for Tesla Model 3",
  "language": "vn"
}
```

### Mock Payment with Vehicle (Testing)

**Endpoint:** `POST /api/v1/payments/mock-payment`

```json
{
  "user_id": 1,
  "package_id": 2,
  "vehicle_id": 5,          // ← Vehicle to assign
  "vnp_response_code": "00", // Success
  "vnp_bank_code": "NCB",
  "vnp_card_type": "ATM"
}
```

## 📝 DTO Structure

### CreatePaymentDto

```typescript
export class CreatePaymentDto {
  @IsInt()
  @IsNotEmpty()
  user_id: number;

  @IsInt()
  @IsNotEmpty()
  package_id: number;

  @IsInt()
  @IsOptional()
  vehicle_id?: number;      // ← Optional vehicle assignment

  @IsString()
  @IsOptional()
  orderDescription?: string;

  @IsString()
  @IsOptional()
  language?: string;
}
```

### MockPaymentDto

```typescript
export class MockPaymentDto {
  @IsInt()
  @IsNotEmpty()
  user_id: number;

  @IsInt()
  @IsNotEmpty()
  package_id: number;

  @IsInt()
  @IsOptional()
  vehicle_id?: number;      // ← Optional vehicle assignment

  @IsString()
  @IsOptional()
  vnp_response_code?: string;

  @IsString()
  @IsOptional()
  vnp_bank_code?: string;

  @IsString()
  @IsOptional()
  vnp_card_type?: string;
}
```

## 🎯 Benefits

1. **Automatic Association**: Vehicle được tự động gán khi payment thành công
2. **Data Consistency**: Không cần update subscription sau khi tạo
3. **User Experience**: User chọn vehicle một lần khi thanh toán
4. **Traceability**: Biết payment này cho vehicle nào ngay từ đầu

## 🧪 Testing

### Test Case 1: Payment Success with Vehicle

```bash
# 1. Create payment with vehicle_id
POST /api/v1/payments/mock-payment
{
  "user_id": 1,
  "package_id": 2,
  "vehicle_id": 5,
  "vnp_response_code": "00"
}

# Expected Result:
# - Payment created with vehicle_id: 5
# - Subscription created with vehicle_id: 5
# - Both linked together
```

### Test Case 2: Payment Success without Vehicle

```bash
# 1. Create payment without vehicle_id
POST /api/v1/payments/mock-payment
{
  "user_id": 1,
  "package_id": 2,
  "vnp_response_code": "00"
}

# Expected Result:
# - Payment created with vehicle_id: null
# - Subscription created with vehicle_id: null
# - User can assign vehicle later via update API
```

### Test Case 3: Payment Failed

```bash
# 1. Create payment with vehicle_id but fail
POST /api/v1/payments/mock-payment
{
  "user_id": 1,
  "package_id": 2,
  "vehicle_id": 5,
  "vnp_response_code": "24"  // Cancelled
}

# Expected Result:
# - Payment created with vehicle_id: 5
# - Payment status: failed
# - No subscription created
```

## 🚨 Important Notes

1. `vehicle_id` is **optional** - có thể null nếu user chưa chọn xe
2. Vehicle phải thuộc về user đang thanh toán
3. Frontend nên validate vehicle ownership trước khi gửi payment request
4. Có thể update vehicle_id sau nếu cần thông qua subscription update API

## 📚 Related Files

- `prisma/models/payments.prisma` - Payment schema
- `prisma/models/subscriptions.prisma` - Subscription schema
- `src/modules/payments/payments.service.ts` - Payment business logic
- `src/modules/payments/dto/create-payment.dto.ts` - Payment DTO
- `src/modules/payments/dto/mock-payment.dto.ts` - Mock payment DTO
