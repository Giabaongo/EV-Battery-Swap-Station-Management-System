# ✅ Fix: MoMo Renewal Payment Post-Processing

## 🐛 Vấn đề

**BEFORE:**
- User thanh toán MoMo renewal thành công
- MoMo redirect về `/momo-return`
- Backend update payment status = success ✅
- **NHƯNG không tạo subscription mới** ❌
- **NHƯNG không mark subscription cũ là cancelled** ❌
- User vẫn có subscription expired!

## 🔍 Nguyên nhân

### Issue #1: Payment Type Mismatch

**Code tạo payment** (line 1398):
```typescript
payment_type: PaymentType.subscription,  // ← Generic type
```

**Code xử lý success** (line 266):
```typescript
switch (paymentType) {
  case 'subscription':
    await this.createSubscriptionFromPayment(payment);  // ← Tạo subscription mới (WRONG!)
    break;
  case 'subscription_renewal':  // ← Không bao giờ match!
    await this.handleSubscriptionRenewalPayment(payment);
    break;
}
```

**Vấn đề:** 
- Renewal payment có `payment_type = 'subscription'`
- Switch case sẽ vào `case 'subscription'`
- Tạo subscription MỚI (wrong logic)
- Không mark subscription CŨ as cancelled

### Issue #2: Missing Enum Value

**Prisma schema:**
```prisma
enum PaymentType {
  subscription
  subscription_with_deposit
  battery_deposit
  battery_replacement
  damage_fee
  other
  // ❌ KHÔNG CÓ subscription_renewal!
}
```

Không thể dùng `payment_type = 'subscription_renewal'` vì không tồn tại trong enum.

### Issue #3: Missing Cancellation Logic

**handleSubscriptionRenewalPayment** (line 1544):
```typescript
// Tạo subscription mới ✅
const newSubscription = await this.prisma.subscription.create({ ... });

// Link payment ✅
await this.prisma.payment.update({ ... });

// ❌ THIẾU: Mark old subscription as cancelled!
```

## 🔧 Giải pháp

### Fix #1: Detect Renewal from order_info

**BEFORE:**
```typescript
private async handleSuccessfulPayment(payment: any) {
  switch (payment.payment_type) {
    case 'subscription':
      await this.createSubscriptionFromPayment(payment);  // WRONG for renewal!
      break;
  }
}
```

**AFTER:**
```typescript
private async handleSuccessfulPayment(payment: any) {
  // Detect renewal from order_info
  let isRenewal = false;
  const orderInfo = payment.order_info || '';
  if (orderInfo.includes('Gia han goi') || orderInfo.includes('gia han')) {
    isRenewal = true;
  }

  // Handle renewal FIRST (before switch case)
  if (isRenewal && payment.payment_type === 'subscription') {
    await this.handleSubscriptionRenewalPayment(payment);
    return;  // ← Exit early
  }

  // Then handle other payment types
  switch (payment.payment_type) {
    case 'subscription':
      await this.createSubscriptionFromPayment(payment);
      break;
    // ...
  }
}
```

**Rationale:**
- Renewal payment có `order_info` chứa "Gia han goi" (từ line 1402)
- Check string thay vì dùng enum (avoid migration)
- Early return để không vào switch case

### Fix #2: Add Cancellation Logic

**BEFORE:**
```typescript
private async handleSubscriptionRenewalPayment(payment: any) {
  // Create new subscription ✅
  const newSubscription = await this.prisma.subscription.create({ ... });
  
  // Link payment ✅
  await this.prisma.payment.update({ ... });
  
  // ❌ MISSING: Cancel old subscription
}
```

**AFTER:**
```typescript
private async handleSubscriptionRenewalPayment(payment: any) {
  // Create new subscription ✅
  const newSubscription = await this.prisma.subscription.create({ ... });
  
  // Link payment ✅
  await this.prisma.payment.update({ ... });
  
  // Mark old subscription as cancelled ✅
  await this.prisma.subscription.update({
    where: { subscription_id: oldSubscription.subscription_id },
    data: { status: SubscriptionStatus.cancelled },
  });
  
  this.logger.log(`Old subscription ${oldSubscription.subscription_id} marked as cancelled`);
}
```

## 🎯 Luồng xử lý (AFTER FIX)

```
1. User click "Gia hạn gói"
   ↓
2. Frontend gọi /momo-subscription-renewal
   ↓
3. Backend tạo payment với:
   - payment_type = 'subscription'
   - order_info = 'Gia han goi [Tên gói] + phat'  ← Detection key
   ↓
4. User thanh toán MoMo
   ↓
5. MoMo redirect → /momo-return
   ↓
6. handleMoMoReturn():
   - Verify signature ✅
   - Update payment.status = success ✅
   - Call handleSuccessfulPayment() ✅
   ↓
7. handleSuccessfulPayment():
   - Check order_info.includes('Gia han goi') → TRUE ✅
   - isRenewal = true ✅
   - Call handleSubscriptionRenewalPayment() ✅
   ↓
8. handleSubscriptionRenewalPayment():
   - Find old expired subscription ✅
   - Create NEW subscription (active) ✅
   - Link payment to new subscription ✅
   - Mark OLD subscription as cancelled ✅
   ↓
9. Redirect user to frontend/payment/success ✅
```

## 📝 Files đã sửa

1. ✅ **payments.service.ts** (line 266-325)
   - Added renewal detection logic
   - Early return for renewal payments

2. ✅ **payments.service.ts** (line 1585-1600)
   - Added old subscription cancellation
   - Added log message

3. ✅ **MOMO_SUBSCRIPTION_RENEWAL_API.md**
   - Updated post-payment flow documentation

## 🧪 Test Case

### Test Renewal Flow:

1. **Setup:**
   ```sql
   -- User có subscription expired
   UPDATE subscriptions 
   SET status = 'expired', 
       end_date = '2025-01-01', 
       distance_traveled = 550  -- Vượt 50km
   WHERE subscription_id = 1;
   ```

2. **Request:**
   ```bash
   POST /api/v1/payments/momo-subscription-renewal
   {
     "subscription_id": 1
   }
   ```

3. **Response:**
   ```json
   {
     "payment_id": 123,
     "paymentUrl": "https://test-payment.momo.vn/...",
     "order_info": "Gia han goi Basic + phat"  // ← Detection key
   }
   ```

4. **User thanh toán thành công**

5. **Verify database:**
   ```sql
   -- Check payment
   SELECT * FROM payments WHERE payment_id = 123;
   -- status = 'success' ✅
   -- order_info = 'Gia han goi Basic + phat' ✅

   -- Check old subscription
   SELECT * FROM subscriptions WHERE subscription_id = 1;
   -- status = 'cancelled' ✅

   -- Check new subscription
   SELECT * FROM subscriptions 
   WHERE user_id = X AND status = 'active' 
   ORDER BY created_at DESC LIMIT 1;
   -- status = 'active' ✅
   -- start_date = today ✅
   -- end_date = today + duration_days ✅
   -- swap_used = 0 ✅
   -- distance_traveled = 0 ✅
   ```

## ⚠️ Edge Cases

### Case 1: Không tìm thấy old subscription
```typescript
if (!oldSubscription) {
  console.warn('Original expired subscription not found for renewal');
  return;  // ← Graceful failure
}
```

### Case 2: order_info không chứa "Gia han goi"
```typescript
if (!orderInfo.includes('Gia han goi') && !orderInfo.includes('gia han')) {
  isRenewal = false;  // ← Treat as normal subscription
}
```

### Case 3: Payment không có package
```typescript
if (!payment.package) return;  // ← Early exit
```

## 🎁 Benefits

1. ✅ **No migration needed** - Dùng `order_info` thay vì enum
2. ✅ **Backward compatible** - Không ảnh hưởng code cũ
3. ✅ **Simple detection** - String matching thay vì complex logic
4. ✅ **Complete flow** - Create new + Cancel old subscription
5. ✅ **Logged** - Easy debugging với log messages

## 🚀 Next Steps

- ✅ Test renewal flow end-to-end
- ✅ Verify old subscription cancelled
- ✅ Verify new subscription created
- ✅ Check payment linked correctly
- ⏳ Consider adding unit tests

## ✅ Done!

MoMo renewal giờ xử lý đúng luồng rồi! 🎉
