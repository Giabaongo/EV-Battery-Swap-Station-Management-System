# ✅ Hoàn thành: Fix MoMo Renewal Post-Payment Processing

## 🐛 Vấn đề đã fix

**Trước:**
- User thanh toán renewal thành công
- Payment status = success ✅
- **NHƯNG không tạo subscription mới** ❌
- **NHƯNG không cancel subscription cũ** ❌

**Bây giờ:**
- User thanh toán renewal thành công
- Payment status = success ✅
- **Tạo subscription mới (active)** ✅
- **Cancel subscription cũ** ✅

## 🔧 Nguyên nhân

1. **Payment type mismatch:**
   - Renewal payment có `payment_type = 'subscription'` (generic)
   - Switch case vào `case 'subscription'` → Tạo subscription MỚI (wrong logic)
   - Không bao giờ vào `case 'subscription_renewal'`

2. **Enum không có subscription_renewal:**
   - Prisma enum chỉ có: subscription, subscription_with_deposit, battery_deposit, etc.
   - Không thể dùng `payment_type = 'subscription_renewal'`

3. **Thiếu logic cancel old subscription:**
   - `handleSubscriptionRenewalPayment` tạo subscription mới
   - Nhưng không mark subscription cũ as cancelled

## ✅ Giải pháp

### Fix #1: Detect renewal từ order_info

```typescript
// Detect từ order_info thay vì payment_type
const orderInfo = payment.order_info || '';
if (orderInfo.includes('Gia han goi') || orderInfo.includes('gia han')) {
  isRenewal = true;
  await this.handleSubscriptionRenewalPayment(payment);
  return;  // Early exit
}
```

**Rationale:**
- Renewal payment có `order_info = "Gia han goi [Tên gói] + phat"`
- Check string thay vì enum (không cần migration)

### Fix #2: Cancel old subscription

```typescript
// Mark old subscription as cancelled
await this.prisma.subscription.update({
  where: { subscription_id: oldSubscription.subscription_id },
  data: { status: SubscriptionStatus.cancelled },
});
```

## 🎯 Luồng hoàn chỉnh (AFTER)

```
User thanh toán MoMo
  → handleMoMoReturn()
  → Update payment.status = success
  → handleSuccessfulPayment()
  → Check order_info.includes('Gia han goi') → TRUE
  → handleSubscriptionRenewalPayment()
  → Find old expired subscription
  → Create NEW subscription (active)
  → Link payment to new subscription
  → Mark OLD subscription as cancelled ✅
  → Done!
```

## 📝 Files đã sửa

1. ✅ **payments.service.ts** (line 266-325)
   - Added renewal detection from order_info
   - Early return for renewal payments

2. ✅ **payments.service.ts** (line 1585-1600)
   - Added old subscription cancellation
   - Added log for debugging

3. ✅ **MOMO_SUBSCRIPTION_RENEWAL_API.md**
   - Updated documentation

4. ✅ **FIX_MOMO_RENEWAL_POST_PROCESSING.md**
   - Detailed technical explanation

## 🧪 Test

```bash
# 1. Tạo expired subscription
UPDATE subscriptions SET status = 'expired' WHERE subscription_id = 1;

# 2. Renewal payment
POST /api/v1/payments/momo-subscription-renewal
{
  "subscription_id": 1
}

# 3. Thanh toán thành công trên MoMo

# 4. Verify
SELECT * FROM subscriptions WHERE subscription_id = 1;
-- status = 'cancelled' ✅

SELECT * FROM subscriptions WHERE user_id = X AND status = 'active';
-- status = 'active' ✅
-- start_date = today ✅
```

## 🎁 Lợi ích

- ✅ Không cần migration (dùng order_info)
- ✅ Backward compatible
- ✅ Complete renewal flow
- ✅ Logged for debugging

## ✅ Done!

MoMo renewal giờ xử lý đầy đủ luồng sau thanh toán rồi! 🎉
