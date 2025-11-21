NguyenVo-FPT: @workspace bên backend tôi muốn subcription không thông qua vnpay nhưng vẫn log đầy đủ lịch sử giao dịch trong db

Workspace: Collecting workspace informationTôi hiểu bạn muốn tạo subscription trực tiếp mà không qua VNPAY nhưng vẫn ghi lại lịch sử thanh toán trong database. Đây là cách implement:

## Giải pháp: Thêm phương thức thanh toán trực tiếp

### 1. Tạo DTO mới cho thanh toán trực tiếp

```typescript
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';

export enum DirectPaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  E_WALLET = 'e_wallet',
}

export class CreateDirectPaymentDto {
  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @IsNumber()
  @IsNotEmpty()
  package_id: number;

  @IsNumber()
  @IsOptional()
  vehicle_id?: number;

  @IsEnum(DirectPaymentMethod)
  @IsNotEmpty()
  payment_method: DirectPaymentMethod;

  @IsString()
  @IsOptional()
  order_info?: string;

  @IsString()
  @IsOptional()
  transaction_id?: string; // For bank transfer or external transaction reference
}
```

### 2. Thêm method trong PaymentsService

```typescript
// ...existing code...

/**
 * Create direct payment and subscription (without VNPAY)
 * This method creates both payment record and subscription immediately
 * Use for: cash, bank transfer, or manual payment processing
 */
async createDirectPayment(createDirectPaymentDto: CreateDirectPaymentDto) {
  // 1. Get package information
  const servicePackage = await this.prisma.batteryServicePackage.findUnique({
    where: { package_id: createDirectPaymentDto.package_id },
  });

  if (!servicePackage) {
    throw new NotFoundException('Package not found');
  }

  if (!servicePackage.active) {
    throw new BadRequestException('Package is not active');
  }

  // 2. Create payment record with success status (since payment is confirmed)
  const payment = await this.prisma.payment.create({
    data: {
      user_id: createDirectPaymentDto.user_id,
      package_id: createDirectPaymentDto.package_id,
      vehicle_id: createDirectPaymentDto.vehicle_id,
      amount: servicePackage.base_price,
      method: createDirectPaymentDto.payment_method as any, // cast to PaymentMethod enum
      status: PaymentStatus.success, // Direct payment is already confirmed
      payment_type: 'subscription' as any,
      payment_time: new Date(),
      transaction_id: createDirectPaymentDto.transaction_id || `DIRECT${moment().format('YYYYMMDDHHmmss')}`,
      order_info: createDirectPaymentDto.order_info || `Direct payment for ${servicePackage.name}`,
    },
    include: {
      package: true,
    },
  });

  // 3. Create subscription immediately
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + servicePackage.duration_days);

  const subscription = await this.prisma.subscription.create({
    data: {
      user_id: createDirectPaymentDto.user_id,
      package_id: createDirectPaymentDto.package_id,
      vehicle_id: createDirectPaymentDto.vehicle_id,
      start_date: startDate,
      end_date: endDate,
      status: 'active',
      swap_used: 0,
    },
    include: {
      package: true,
      vehicle: true,
    },
  });

  // 4. Link payment to subscription
  await this.prisma.payment.update({
    where: { payment_id: payment.payment_id },
    data: { subscription_id: subscription.subscription_id },
  });

  return {
    success: true,
    payment: {
      ...payment,
      subscription_id: subscription.subscription_id,
    },
    subscription,
    message: 'Direct payment processed successfully and subscription created',
  };
}

// ...existing code...
```

### 3. Thêm endpoint trong PaymentsController

```typescript
// ...existing code...

/**
 * Create direct payment (without VNPAY redirect)
 * POST /payments/direct
 * 
 * Use this for:
 * - Cash payments at station
 * - Bank transfer confirmations
 * - Manual payment processing by staff/admin
 */
@Post('direct')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin', 'station_staff', 'driver') // Allow staff to process payments
async createDirectPayment(@Body() createDirectPaymentDto: CreateDirectPaymentDto) {
  return this.paymentsService.createDirectPayment(createDirectPaymentDto);
}

// ...existing code...
```

### 4. Cập nhật API Endpoints trong constants

```javascript
// ...existing code...

PAYMENT: {
  // Basic VNPAY endpoints
  CREATE_VNPAY_URL: "/payments/create-vnpay-url",
  CREATE_VNPAY_URL_ADVANCED: "/payments/create-vnpay-url-advanced",
  CREATE_VNPAY_URL_WITH_FEES: "/payments/calculate-and-create-vnpay-url",
  
  // Direct payment (no VNPAY)
  CREATE_DIRECT_PAYMENT: "/payments/direct", // NEW
  
  // ...existing code...
}

// ...existing code...
```

### 5. Tạo service method trong frontend

```javascript
// ...existing code...

/**
 * Create direct payment without VNPAY
 * @param {Object} paymentData - Payment information
 * @param {number} paymentData.user_id - User ID
 * @param {number} paymentData.package_id - Package ID
 * @param {number} paymentData.vehicle_id - Vehicle ID (optional)
 * @param {string} paymentData.payment_method - cash | bank_transfer | credit_card | e_wallet
 * @param {string} paymentData.order_info - Order description (optional)
 * @param {string} paymentData.transaction_id - External transaction reference (optional)
 */
const createDirectPayment = async (paymentData) => {
  try {
    const response = await api.post(API_ENDPOINTS.PAYMENT.CREATE_DIRECT_PAYMENT, paymentData);
    console.log("Direct payment created:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating direct payment:", error);
    throw error;
  }
};

export const paymentService = {
  getPaymentByUserId,
  createPayment,
  handleVnpayReturn,
  createDirectPayment, // NEW
};
```

## Cách sử dụng

### Từ Frontend (Driver tự thanh toán)

```javascript
// Example: User pays with cash at station
const result = await paymentService.createDirectPayment({
  user_id: currentUser.id,
  package_id: selectedPackage.id,
  vehicle_id: selectedVehicle.id,
  payment_method: 'cash',
  order_info: 'Cash payment at Station ABC',
});

// Result contains both payment and subscription
console.log(result.payment); // Payment record
console.log(result.subscription); // Active subscription
```

### Từ Backend API (Staff xử lý)

```bash
curl -X POST http://localhost:8080/api/v1/payments/direct \
  -H "Authorization: Bearer <STAFF_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "package_id": 2,
    "vehicle_id": 5,
    "payment_method": "bank_transfer",
    "transaction_id": "BT20250121001",
    "order_info": "Bank transfer confirmation"
  }'
```

## Lợi ích

✅ **Ghi lại đầy đủ lịch sử**: Mọi thanh toán đều được lưu trong bảng `payments`  
✅ **Tạo subscription ngay lập tức**: Không cần chờ callback từ VNPAY  
✅ **Hỗ trợ nhiều phương thức**: Cash, bank transfer, credit card, e-wallet  
✅ **Linh hoạt**: Staff có thể xác nhận thanh toán manual  
✅ **Audit trail**: Có thể trace lại transaction_id từ hệ thống ngân hàng  

## So sánh với VNPAY flow

| Feature | VNPAY Flow | Direct Payment |
|---------|-----------|----------------|
| Payment status | pending → success | success (immediate) |
| Subscription created | After callback | Immediately |
| Payment method | vnpay only | cash, bank_transfer, etc. |
| Use case | Online payment | In-person, manual confirmation |
| Database records | Payment + Subscription | Payment + Subscription |

Bây giờ bạn có thể:

- Dùng VNPAY cho thanh toán online
- Dùng direct payment cho thanh toán tại trạm/manual processing
- Cả hai đều ghi lại đầy đủ lịch sử trong database
